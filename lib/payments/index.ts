/**
 * Главный модуль платежных систем
 * Поддерживает: YooKassa, Stripe, PayPal, CryptoPay (Telegram)
 */

export type PaymentProvider = 'yookassa' | 'stripe' | 'paypal' | 'cryptopay'

export interface PaymentConfig {
  provider: PaymentProvider
  enabled: boolean
  testMode: boolean
}

export interface CreatePaymentParams {
  provider: PaymentProvider
  amount: number
  currency: string
  userId: string
  description?: string
  returnUrl?: string
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  success: boolean
  paymentId: string
  paymentUrl?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

export interface WebhookPayload {
  provider: PaymentProvider
  paymentId: string
  status: string
  amount: number
  currency: string
  metadata?: Record<string, unknown>
}

// Re-export all payment providers
export * from './yookassa'
export * from './stripe'
export * from './paypal'
export * from './cryptopay'
export * from './utils'
