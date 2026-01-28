import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"
import { refundTransaction } from "@/lib/billing"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const tab = searchParams.get("tab") || "eligible"
    const search = searchParams.get("search")
    
    const skip = (page - 1) * limit
    
    // Stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [totalRefunds, totalAmount, thisMonth] = await Promise.all([
      prisma.transaction.count({
        where: { type: TransactionType.REFUND, status: PaymentStatus.COMPLETED },
      }),
      prisma.transaction.aggregate({
        where: { type: TransactionType.REFUND, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.REFUND,
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ])
    
    const stats = {
      totalRefunds,
      totalAmount: totalAmount._sum.amount || 0,
      pendingCount: 0, // For future pending refund requests
      thisMonth: thisMonth._sum.amount || 0,
    }
    
    if (tab === "history") {
      // Get refund history
      const where = {
        type: TransactionType.REFUND,
        status: PaymentStatus.COMPLETED,
        ...(search && {
          OR: [
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { id: { contains: search } },
          ],
        }),
      }
      
      const [refunds, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where }),
      ])
      
      return NextResponse.json({
        refunds,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }
    
    // Get eligible transactions for refund (purchases and deposits)
    const where = {
      type: { in: [TransactionType.PURCHASE, TransactionType.DEPOSIT] },
      status: PaymentStatus.COMPLETED,
      amount: { not: 0 },
      ...(search && {
        OR: [
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { id: { contains: search } },
        ],
      }),
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])
    
    return NextResponse.json({
      transactions,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: unknown) {
    console.error("Refunds GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    
    const { transactionId, amount, reason } = await req.json()
    
    if (!transactionId) {
      return NextResponse.json({ error: "ID транзакции обязателен" }, { status: 400 })
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Укажите корректную сумму" }, { status: 400 })
    }
    
    // Get original transaction
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { id: true, email: true, balance: true } },
      },
    })
    
    if (!originalTransaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 })
    }
    
    const maxRefundAmount = Math.abs(originalTransaction.amount)
    if (amount > maxRefundAmount) {
      return NextResponse.json(
        { error: `Максимальная сумма возврата: ${maxRefundAmount}` },
        { status: 400 }
      )
    }
    
    // Process refund
    const refund = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: originalTransaction.userId },
        select: { balance: true },
      })
      
      if (!user) throw new Error("Пользователь не найден")
      
      const balanceBefore = user.balance
      const balanceAfter = balanceBefore + amount
      
      // Create refund transaction
      const refundTx = await tx.transaction.create({
        data: {
          userId: originalTransaction.userId,
          type: TransactionType.REFUND,
          amount: amount,
          balanceBefore,
          balanceAfter,
          description: reason || "Возврат средств",
          status: PaymentStatus.COMPLETED,
          metadata: {
            originalTransactionId: transactionId,
            adminId: admin.id,
            adminEmail: admin.email,
          },
        },
      })
      
      // Update user balance
      await tx.user.update({
        where: { id: originalTransaction.userId },
        data: { balance: balanceAfter },
      })
      
      // Log admin action
      await tx.adminLog.create({
        data: {
          adminId: admin.id,
          action: "REFUND_PROCESSED",
          target: `transaction:${transactionId}`,
          details: {
            userId: originalTransaction.userId,
            userEmail: originalTransaction.user.email,
            amount,
            reason,
            originalAmount: originalTransaction.amount,
          },
        },
      })
      
      return refundTx
    })
    
    return NextResponse.json({
      success: true,
      refund,
      message: `Возврат на сумму ${amount} ₽ выполнен успешно`,
    })
    
  } catch (error: unknown) {
    console.error("Refund POST error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка возврата" },
      { status: 500 }
    )
  }
}
