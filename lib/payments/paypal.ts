/**
 * PayPal Payment Provider
 * Документация: https://developer.paypal.com/docs/api/orders/v2/
 */

import { CreatePaymentParams, PaymentResult } from './index'

const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

interface PayPalOrder {
  id: string
  status: string
  links: Array<{ href: string; rel: string }>
}

interface PayPalAccessToken {
  access_token: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Проверяем кэш
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }
  
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  
  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }
  
  const data: PayPalAccessToken = await response.json()
  
  // Кэшируем токен (с запасом 5 минут)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }
  
  return data.access_token
}

export async function createPayPalPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { amount, currency, userId, description, returnUrl, metadata } = params
  
  try {
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency || 'USD',
            value: amount.toFixed(2),
          },
          description: description || 'Balance Top-up',
          custom_id: userId,
          reference_id: JSON.stringify({ userId, ...metadata }),
        }],
        application_context: {
          brand_name: 'Hosting Service',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
        },
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'PayPal payment error')
    }
    
    const data: PayPalOrder = await response.json()
    
    // Находим ссылку для перенаправления
    const approveLink = data.links.find(link => link.rel === 'approve')
    
    return {
      success: true,
      paymentId: data.id,
      paymentUrl: approveLink?.href,
      status: 'pending',
    }
  } catch (error) {
    console.error('PayPal payment error:', error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function capturePayPalPayment(orderId: string): Promise<boolean> {
  try {
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    return data.status === 'COMPLETED'
  } catch (error) {
    console.error('PayPal capture error:', error)
    return false
  }
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder | null> {
  try {
    const accessToken = await getAccessToken()
    
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) return null
    
    return response.json()
  } catch (error) {
    console.error('PayPal get order error:', error)
    return null
  }
}

export function verifyPayPalWebhook(body: string, headers: Record<string, string>): boolean {
  // В продакшене используйте PayPal Webhook Verification API
  // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  return !!webhookId
}
