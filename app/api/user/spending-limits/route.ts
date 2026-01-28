import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    // Get user's spending limit settings
    const limit = await prisma.spendingLimit.findUnique({
      where: { userId: user.id },
    })
    
    // Calculate current spending
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [todayTransactions, monthTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: TransactionType.PURCHASE,
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: TransactionType.PURCHASE,
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
      }),
    ])
    
    const todaySpent = todayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const monthSpent = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const stats = {
      todaySpent,
      monthSpent,
      todayRemaining: limit?.dailyLimit ? Math.max(0, limit.dailyLimit - todaySpent) : null,
      monthRemaining: limit?.monthlyLimit ? Math.max(0, limit.monthlyLimit - monthSpent) : null,
    }
    
    return NextResponse.json({ limit, stats })
    
  } catch (error: unknown) {
    console.error("Spending limits GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const { isEnabled, monthlyLimit, dailyLimit, alertAt } = await req.json()
    
    // Validate limits
    if (monthlyLimit !== null && monthlyLimit < 0) {
      return NextResponse.json({ error: "Лимит не может быть отрицательным" }, { status: 400 })
    }
    if (dailyLimit !== null && dailyLimit < 0) {
      return NextResponse.json({ error: "Лимит не может быть отрицательным" }, { status: 400 })
    }
    if (alertAt !== null && (alertAt < 10 || alertAt > 100)) {
      return NextResponse.json({ error: "Порог уведомления должен быть от 10 до 100%" }, { status: 400 })
    }
    
    const limit = await prisma.spendingLimit.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isEnabled: isEnabled ?? true,
        monthlyLimit: monthlyLimit || null,
        dailyLimit: dailyLimit || null,
        alertAt: alertAt || 80,
      },
      update: {
        isEnabled: isEnabled ?? true,
        monthlyLimit: monthlyLimit || null,
        dailyLimit: dailyLimit || null,
        alertAt: alertAt || 80,
      },
    })
    
    return NextResponse.json({ success: true, limit })
    
  } catch (error: unknown) {
    console.error("Spending limits POST error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка сохранения" },
      { status: 500 }
    )
  }
}
