/**
 * Утилиты для платежных систем
 */

import prisma from '../db'
import { PaymentProvider, CreatePaymentParams, PaymentResult } from './index'
import { createYooKassaPayment } from './yookassa'
import { createStripePayment } from './stripe'
import { createPayPalPayment } from './paypal'
import { createCryptoPayPayment } from './cryptopay'
import { TransactionType, PaymentStatus } from '@prisma/client'

// Создать платеж через выбранного провайдера
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { provider } = params
  
  switch (provider) {
    case 'yookassa':
      return createYooKassaPayment(params)
    case 'stripe':
      return createStripePayment(params)
    case 'paypal':
      return createPayPalPayment(params)
    case 'cryptopay':
      return createCryptoPayPayment(params)
    default:
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: `Unknown payment provider: ${provider}`,
      }
  }
}

// Создать pending транзакцию при инициации платежа
export async function createPendingTransaction(
  userId: string,
  amount: number,
  provider: PaymentProvider,
  paymentId: string,
  metadata?: Record<string, unknown>
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })
  
  if (!user) throw new Error('User not found')
  
  return prisma.transaction.create({
    data: {
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: user.balance,
      balanceAfter: user.balance, // Пока не изменяем - это pending
      description: `Пополнение через ${getProviderName(provider)}`,
      paymentMethod: provider,
      paymentId,
      status: PaymentStatus.PENDING,
      metadata: metadata as any,
    },
  })
}

// Подтвердить платеж и зачислить средства
export async function confirmPayment(paymentId: string, provider: PaymentProvider) {
  return prisma.$transaction(async (tx) => {
    // Находим pending транзакцию
    const transaction = await tx.transaction.findFirst({
      where: {
        paymentId,
        paymentMethod: provider,
        status: PaymentStatus.PENDING,
      },
      include: { user: { select: { balance: true } } },
    })
    
    if (!transaction) {
      throw new Error('Transaction not found')
    }
    
    const newBalance = transaction.user.balance + transaction.amount
    
    // Обновляем транзакцию
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.COMPLETED,
        balanceBefore: transaction.user.balance,
        balanceAfter: newBalance,
      },
    })
    
    // Обновляем баланс пользователя
    await tx.user.update({
      where: { id: transaction.userId },
      data: { balance: newBalance },
    })
    
    return { userId: transaction.userId, amount: transaction.amount, newBalance }
  })
}

// Отменить/провалить платеж
export async function failPayment(paymentId: string, provider: PaymentProvider, reason?: string) {
  return prisma.transaction.updateMany({
    where: {
      paymentId,
      paymentMethod: provider,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.FAILED,
      description: reason ? `Ошибка: ${reason}` : undefined,
    },
  })
}

// Получить название провайдера на русском
export function getProviderName(provider: PaymentProvider): string {
  const names: Record<PaymentProvider, string> = {
    yookassa: 'ЮKassa',
    stripe: 'Stripe',
    paypal: 'PayPal',
    cryptopay: 'Криптовалюта',
  }
  return names[provider] || provider
}

// Получить доступные методы оплаты
export function getAvailablePaymentMethods(): { provider: PaymentProvider; name: string; enabled: boolean; currencies: string[] }[] {
  return [
    {
      provider: 'yookassa',
      name: 'ЮKassa (Карты РФ)',
      enabled: !!(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY),
      currencies: ['RUB'],
    },
    {
      provider: 'stripe',
      name: 'Stripe (Международные карты)',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      currencies: ['USD', 'EUR', 'GBP'],
    },
    {
      provider: 'paypal',
      name: 'PayPal',
      enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      currencies: ['USD', 'EUR', 'GBP'],
    },
    {
      provider: 'cryptopay',
      name: 'Криптовалюта',
      enabled: !!process.env.CRYPTOPAY_API_TOKEN,
      currencies: ['USDT', 'BTC', 'ETH', 'TON'],
    },
  ]
}

// Конвертировать валюту (упрощенно, в продакшене использовать API курсов)
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  // Примерные курсы для демо
  const rates: Record<string, number> = {
    'USD_RUB': 90,
    'RUB_USD': 0.011,
    'EUR_RUB': 98,
    'RUB_EUR': 0.010,
    'EUR_USD': 1.08,
    'USD_EUR': 0.92,
  }
  
  if (from === to) return amount
  
  const key = `${from}_${to}`
  const rate = rates[key]
  
  if (rate) {
    return amount * rate
  }
  
  // Если прямого курса нет, пробуем через USD
  const toUsd = rates[`${from}_USD`] || 1
  const fromUsd = rates[`USD_${to}`] || 1
  
  return amount * toUsd * fromUsd
}
