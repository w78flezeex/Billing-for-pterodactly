/**
 * API для создания платежа
 * POST /api/billing/payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createPayment, createPendingTransaction, getAvailablePaymentMethods, PaymentProvider } from '@/lib/payments'

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, amount, currency } = body as {
      provider: PaymentProvider
      amount: number
      currency?: string
    }

    // Валидация
    if (!provider || !amount) {
      return NextResponse.json(
        { error: 'Укажите провайдера и сумму' },
        { status: 400 }
      )
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Минимальная сумма пополнения: 10' },
        { status: 400 }
      )
    }

    if (amount > 1000000) {
      return NextResponse.json(
        { error: 'Максимальная сумма пополнения: 1,000,000' },
        { status: 400 }
      )
    }

    // Проверяем доступность метода оплаты
    const methods = getAvailablePaymentMethods()
    const method = methods.find(m => m.provider === provider)
    
    if (!method || !method.enabled) {
      return NextResponse.json(
        { error: 'Метод оплаты недоступен' },
        { status: 400 }
      )
    }

    // Создаем платеж
    const result = await createPayment({
      provider,
      amount,
      currency: currency || method.currencies[0],
      userId: auth.id,
      description: `Пополнение баланса на ${amount}`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      metadata: { source: 'web' },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Ошибка создания платежа' },
        { status: 500 }
      )
    }

    // Создаем pending транзакцию
    await createPendingTransaction(
      auth.id,
      amount,
      provider,
      result.paymentId,
      { currency }
    )

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET - получить доступные методы оплаты
export async function GET() {
  try {
    const methods = getAvailablePaymentMethods()
    
    return NextResponse.json({
      methods: methods.map(m => ({
        provider: m.provider,
        name: m.name,
        enabled: m.enabled,
        currencies: m.currencies,
      })),
    })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
