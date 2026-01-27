import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { depositBalance } from "@/lib/billing"

// IP адреса YooKassa для верификации webhook
const YOOKASSA_IPS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
  "2a02:5180::/32",
]

interface YooKassaWebhookPayload {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    paid: boolean
    metadata?: {
      transactionId?: string
      userId?: string
      userEmail?: string
    }
  }
}

// POST - Webhook от YooKassa
export async function POST(request: NextRequest) {
  try {
    // В продакшене нужно проверять IP адрес
    // const clientIp = request.headers.get('x-forwarded-for') || request.ip
    // if (!isYooKassaIP(clientIp)) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    const body: YooKassaWebhookPayload = await request.json()
    
    console.log("YooKassa webhook received:", JSON.stringify(body, null, 2))

    // Обрабатываем только события успешной оплаты
    if (body.event !== "payment.succeeded" && body.object?.status !== "succeeded") {
      return NextResponse.json({ received: true })
    }

    const payment = body.object
    const transactionId = payment.metadata?.transactionId
    const userId = payment.metadata?.userId

    if (!transactionId) {
      console.error("No transactionId in webhook metadata")
      return NextResponse.json({ error: "No transactionId" }, { status: 400 })
    }

    // Проверяем транзакцию в БД
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    })

    if (!transaction) {
      console.error("Transaction not found:", transactionId)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Проверяем что транзакция ещё не обработана
    if (transaction.status === "COMPLETED") {
      console.log("Transaction already completed:", transactionId)
      return NextResponse.json({ received: true, already_processed: true })
    }

    // Проверяем сумму
    const paidAmount = parseFloat(payment.amount.value)
    if (paidAmount !== transaction.amount) {
      console.error("Amount mismatch:", paidAmount, "vs", transaction.amount)
      // Можно либо отклонить, либо принять с фактической суммой
    }

    // Зачисляем средства на баланс
    await depositBalance({
      userId: transaction.userId,
      type: "DEPOSIT",
      amount: transaction.amount,
      description: `Пополнение баланса (YooKassa #${payment.id.slice(-8)})`,
      paymentMethod: "yookassa",
      paymentId: payment.id,
    })

    // Обновляем статус транзакции
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: "COMPLETED",
        paymentId: payment.id,
      },
    })

    // Создаём уведомление пользователю
    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        type: "PAYMENT",
        title: "Баланс пополнен",
        message: `На ваш баланс зачислено ${transaction.amount} ₽`,
      },
    })

    console.log("Payment processed successfully:", transactionId)

    return NextResponse.json({ 
      received: true,
      transactionId,
      amount: transaction.amount,
    })
  } catch (error) {
    console.error("YooKassa webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    )
  }
}

// Также добавляем GET для проверки работоспособности
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    webhook: "yookassa",
    timestamp: new Date().toISOString(),
  })
}
