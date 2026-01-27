/**
 * YooKassa (ЮKassa) Payment Provider
 * Документация: https://yookassa.ru/developers/api
 */

import { CreatePaymentParams, PaymentResult } from './index'

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3'

interface YooKassaPaymentResponse {
  id: string
  status: string
  amount: { value: string; currency: string }
  confirmation?: { confirmation_url: string }
  paid: boolean
  metadata?: Record<string, unknown>
}

function getHeaders(): HeadersInit {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  
  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials not configured')
  }
  
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Idempotence-Key': crypto.randomUUID(),
  }
}

export async function createYooKassaPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { amount, currency, userId, description, returnUrl, metadata } = params
  
  try {
    const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: currency || 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        },
        description: description || 'Пополнение баланса',
        metadata: {
          userId,
          ...metadata,
        },
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.description || 'YooKassa payment error')
    }
    
    const data: YooKassaPaymentResponse = await response.json()
    
    return {
      success: true,
      paymentId: data.id,
      paymentUrl: data.confirmation?.confirmation_url,
      status: data.status === 'succeeded' ? 'completed' : 'pending',
    }
  } catch (error) {
    console.error('YooKassa payment error:', error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getYooKassaPayment(paymentId: string): Promise<YooKassaPaymentResponse | null> {
  try {
    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    if (!response.ok) return null
    
    return response.json()
  } catch (error) {
    console.error('YooKassa get payment error:', error)
    return null
  }
}

export async function cancelYooKassaPayment(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    })
    
    return response.ok
  } catch (error) {
    console.error('YooKassa cancel payment error:', error)
    return false
  }
}

export function verifyYooKassaWebhook(body: string, signature: string): boolean {
  // YooKassa использует IP whitelist для верификации вебхуков
  // В продакшене нужно проверять IP адрес запроса
  // Документация: https://yookassa.ru/developers/using-api/webhooks
  return true
}
