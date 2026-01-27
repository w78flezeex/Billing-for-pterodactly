import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { depositBalance } from "@/lib/billing"
import { checkRateLimit, getClientIP, isValidId, RATE_LIMITS, logSecurityEvent } from "@/lib/security"

// POST - Обработка тестового платежа
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  // Rate limiting - защита от брутфорса
  const rateCheck = checkRateLimit(`payment:${ip}`, RATE_LIMITS.payment)
  if (!rateCheck.allowed) {
    await logSecurityEvent({
      type: "RATE_LIMIT",
      ip,
      path: "/api/billing/test-payment",
    })
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { transactionId, success } = body

    // Валидация transactionId
    if (!transactionId || !isValidId(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      )
    }

    // Находим транзакцию
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Проверяем что транзакция ещё не обработана
    if (transaction.status !== "PENDING") {
      return NextResponse.json({
        success: true,
        message: "Transaction already processed",
        status: transaction.status,
      })
    }

    if (success) {
      // Зачисляем средства на баланс
      await depositBalance({
        userId: transaction.userId,
        type: "DEPOSIT",
        amount: transaction.amount,
        description: `Пополнение баланса (Тестовый платёж)`,
        paymentMethod: "test",
        paymentId: `TEST-${Date.now()}`,
      })

      // Обновляем статус транзакции
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          paymentId: `TEST-${Date.now()}`,
        },
      })

      // Создаём уведомление
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          type: "PAYMENT",
          title: "Баланс пополнен",
          message: `На ваш баланс зачислено ${transaction.amount} ₽`,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Payment completed",
        amount: transaction.amount,
      })
    } else {
      // Отклоняем платёж
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "FAILED" },
      })

      return NextResponse.json({
        success: false,
        message: "Payment declined",
      })
    }
  } catch (error) {
    console.error("Test payment error:", error)
    return NextResponse.json(
      { error: "Payment processing error" },
      { status: 500 }
    )
  }
}
