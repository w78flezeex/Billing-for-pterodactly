import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// Изменение баланса пользователя
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true, id: true },
    })

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    const { id } = await params
    const { action, amount, reason } = await request.json()

    if (!action || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Укажите действие и сумму" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { balance: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const currentBalance = user.balance
    let newBalance: number
    let transactionType: "BONUS" | "REFUND"
    let transactionAmount: number

    if (action === "add") {
      newBalance = currentBalance + amount
      transactionType = "BONUS"
      transactionAmount = amount
    } else if (action === "subtract") {
      newBalance = Math.max(0, currentBalance - amount)
      transactionType = "REFUND"
      transactionAmount = -Math.min(amount, currentBalance)
    } else {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 })
    }

    // Обновляем баланс и создаём транзакцию
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { balance: newBalance },
      }),
      prisma.transaction.create({
        data: {
          userId: id,
          type: transactionType,
          amount: transactionAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: reason || (action === "add" ? "Начисление от администратора" : "Списание администратором"),
          status: "COMPLETED",
        },
      }),
      prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: "CHANGE_BALANCE",
          target: `user:${id}`,
          details: {
            action,
            amount,
            reason,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      newBalance,
    })
  } catch (error) {
    console.error("Admin change balance error:", error)
    return NextResponse.json(
      { error: "Ошибка при изменении баланса" },
      { status: 500 }
    )
  }
}
