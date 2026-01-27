import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getTransactionHistory } from "@/lib/billing"
import prisma from "@/lib/db"
import { createYooKassaPayment } from "@/lib/payments/yookassa"
import { checkRateLimit, getClientIP, RATE_LIMITS, logSecurityEvent } from "@/lib/security"

// Получить настройку тестового режима из БД
async function isTestMode(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "payment_test_mode" },
    })
    if (setting !== null) {
      return setting.value as boolean
    }
  } catch {
    // Игнорируем ошибки
  }
  // По умолчанию: тестовый режим если нет YooKassa ключей
  return !process.env.YOOKASSA_SHOP_ID
}

// GET - История транзакций
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Ограничение максимума

    const result = await getTransactionHistory(user.id, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении транзакций" },
      { status: 500 }
    )
  }
}

// POST - Создание платежа для пополнения
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  // Rate limiting для платежей
  const rateCheck = checkRateLimit(`payment:${ip}`, RATE_LIMITS.payment)
  if (!rateCheck.allowed) {
    await logSecurityEvent({
      type: "RATE_LIMIT",
      ip,
      path: "/api/billing/transactions",
    })
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
    )
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, paymentMethod } = body

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: "Минимальная сумма пополнения: 50 ₽" },
        { status: 400 }
      )
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: "Максимальная сумма пополнения: 100 000 ₽" },
        { status: 400 }
      )
    }

    // Получаем текущий баланс пользователя
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true, email: true },
    })

    // Проверяем режим работы
    const testMode = await isTestMode()

    // Создаём pending транзакцию
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore: currentUser?.balance || 0,
        balanceAfter: (currentUser?.balance || 0) + amount,
        description: "Пополнение баланса",
        paymentMethod: testMode ? "test" : (paymentMethod || "yookassa"),
        status: "PENDING",
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // ТЕСТОВЫЙ РЕЖИМ - перенаправляем на локальную страницу оплаты
    if (testMode) {
      return NextResponse.json({
        success: true,
        paymentUrl: `${appUrl}/billing/pay?transactionId=${transaction.id}&amount=${amount}`,
        transactionId: transaction.id,
        testMode: true,
      })
    }

    // РЕАЛЬНЫЙ РЕЖИМ - создаём платёж в YooKassa
    const paymentResult = await createYooKassaPayment({
      provider: "yookassa",
      amount,
      currency: "RUB",
      userId: user.id,
      description: `Пополнение баланса #${transaction.id.slice(-8)}`,
      returnUrl: `${appUrl}/billing/success?transactionId=${transaction.id}`,
      metadata: {
        transactionId: transaction.id,
        userEmail: currentUser?.email,
      },
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      // Отменяем транзакцию при ошибке
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      })
      
      return NextResponse.json(
        { error: paymentResult.error || "Ошибка создания платежа" },
        { status: 500 }
      )
    }

    // Сохраняем ID платежа YooKassa
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paymentId: paymentResult.paymentId },
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error("Create payment error:", error)
    return NextResponse.json(
      { error: "Ошибка при создании платежа" },
      { status: 500 }
    )
  }
}
