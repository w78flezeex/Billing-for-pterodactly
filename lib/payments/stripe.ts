/**
 * Stripe Payment Provider
 * Документация: https://stripe.com/docs/api
 */

import { CreatePaymentParams, PaymentResult } from './index'

const STRIPE_API_URL = 'https://api.stripe.com/v1'

interface StripeCheckoutSession {
  id: string
  url: string
  status: string
  payment_status: string
  metadata?: Record<string, string>
}

function getHeaders(): HeadersInit {
  const secretKey = process.env.STRIPE_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('Stripe credentials not configured')
  }
  
  return {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

function toFormData(obj: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key
    
    if (typeof value === 'object' && value !== null) {
      parts.push(toFormData(value as Record<string, unknown>, fullKey))
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
    }
  }
  
  return parts.join('&')
}

export async function createStripePayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { amount, currency, userId, description, returnUrl, metadata } = params
  
  try {
    // Stripe использует центы для валют типа USD, EUR
    const amountInCents = Math.round(amount * 100)
    
    const body = toFormData({
      mode: 'payment',
      success_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
      'line_items[0][price_data][currency]': currency?.toLowerCase() || 'usd',
      'line_items[0][price_data][product_data][name]': description || 'Balance Top-up',
      'line_items[0][price_data][unit_amount]': amountInCents,
      'line_items[0][quantity]': 1,
      'metadata[userId]': userId,
      ...Object.fromEntries(
        Object.entries(metadata || {}).map(([k, v]) => [`metadata[${k}]`, v])
      ),
    })
    
    const response = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Stripe payment error')
    }
    
    const data: StripeCheckoutSession = await response.json()
    
    return {
      success: true,
      paymentId: data.id,
      paymentUrl: data.url,
      status: data.payment_status === 'paid' ? 'completed' : 'pending',
    }
  } catch (error) {
    console.error('Stripe payment error:', error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getStripeSession(sessionId: string): Promise<StripeCheckoutSession | null> {
  try {
    const response = await fetch(`${STRIPE_API_URL}/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    if (!response.ok) return null
    
    return response.json()
  } catch (error) {
    console.error('Stripe get session error:', error)
    return null
  }
}

export function verifyStripeWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured')
    return false
  }
  
  // В продакшене используйте stripe.webhooks.constructEvent
  // Здесь упрощенная проверка
  try {
    const crypto = require('crypto')
    const elements = signature.split(',')
    const timestamp = elements.find((e: string) => e.startsWith('t='))?.split('=')[1]
    const v1 = elements.find((e: string) => e.startsWith('v1='))?.split('=')[1]
    
    if (!timestamp || !v1) return false
    
    const payload = `${timestamp}.${body}`
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(v1),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
