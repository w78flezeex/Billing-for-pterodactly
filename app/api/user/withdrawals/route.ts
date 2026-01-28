import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Get user's withdrawal requests and balance
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = currentUser.id

    // Get user with balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get withdrawal requests
    const requests = await prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Calculate pending withdrawals
    const pendingWithdrawals = requests
      .filter(r => r.status === "PENDING" || r.status === "PROCESSING")
      .reduce((sum, r) => sum + r.amount, 0)

    // Get total bonus amount (not withdrawable)
    const bonusTransactions = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "BONUS",
        status: "COMPLETED",
      },
      _sum: { amount: true },
    })

    const bonusAmount = bonusTransactions._sum.amount || 0
    const availableBalance = Math.max(0, user.balance - pendingWithdrawals - bonusAmount)

    return NextResponse.json({
      requests,
      balance: {
        current: user.balance,
        pending: pendingWithdrawals,
        available: availableBalance,
      },
    })
  } catch (error) {
    console.error("Error fetching withdrawals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new withdrawal request
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = currentUser.id
    const body = await req.json()
    const { amount, method, details } = body

    // Validate
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Минимальная сумма вывода: 100 ₽" },
        { status: 400 }
      )
    }

    if (!method || !["CARD", "YOOMONEY", "QIWI", "CRYPTO"].includes(method)) {
      return NextResponse.json(
        { error: "Неверный способ вывода" },
        { status: 400 }
      )
    }

    if (!details || typeof details !== "object") {
      return NextResponse.json(
        { error: "Укажите реквизиты для вывода" },
        { status: 400 }
      )
    }

    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate available balance
    const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      _sum: { amount: true },
    })

    const bonusTransactions = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "BONUS",
        status: "COMPLETED",
      },
      _sum: { amount: true },
    })

    const pendingAmount = pendingWithdrawals._sum.amount || 0
    const bonusAmount = bonusTransactions._sum.amount || 0
    const availableBalance = Math.max(0, user.balance - pendingAmount - bonusAmount)

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Недостаточно средств для вывода" },
        { status: 400 }
      )
    }

    // Check for existing pending requests (limit to 3)
    const pendingCount = await prisma.withdrawalRequest.count({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    })

    if (pendingCount >= 3) {
      return NextResponse.json(
        { error: "Превышен лимит активных заявок (максимум 3)" },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const request = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        method,
        details,
        status: "PENDING",
      },
    })

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error creating withdrawal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
