import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Get all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { paymentId: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ]
    }
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }

    const [transactions, total, stats] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Get deposits and purchases totals
    const [deposits, purchases] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "DEPOSIT", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "PURCHASE", status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalCount: stats._count,
        deposits: deposits._sum.amount || 0,
        purchases: Math.abs(purchases._sum.amount || 0),
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// POST - Create manual transaction (admin bonus/refund)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, amount, description } = body

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: "Укажите пользователя, тип и сумму" },
        { status: 400 }
      )
    }

    // Get user and update balance
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const balanceBefore = targetUser.balance
    const balanceAfter = balanceBefore + amount

    // Create transaction and update balance atomically
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || `Административная операция: ${type}`,
          status: "COMPLETED",
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      }),
    ])

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
