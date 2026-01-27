/**
 * Crypto Pay (@send bot) Payment Provider
 * Документация: https://help.send.tg/en/articles/10279948-crypto-pay-api
 * API: https://pay.send.tg/api/
 */

import { CreatePaymentParams, PaymentResult } from './index'

const CRYPTOPAY_API_URL = 'https://pay.send.tg/api'

// Поддерживаемые криптовалюты
export type CryptoAsset = 'USDT' | 'TON' | 'BTC' | 'ETH' | 'LTC' | 'BNB' | 'TRX' | 'USDC'

interface CryptoPayInvoice {
  invoice_id: number
  hash: string
  currency_type: string
  asset?: string
  fiat?: string
  amount: string
  pay_url: string
  bot_invoice_url: string
  mini_app_invoice_url: string
  web_app_invoice_url: string
  description?: string
  status: 'active' | 'paid' | 'expired'
  created_at: string
  paid_at?: string
  allow_comments: boolean
  allow_anonymous: boolean
  expiration_date?: string
  paid_anonymously?: boolean
  comment?: string
  hidden_message?: string
  payload?: string
  paid_btn_name?: string
  paid_btn_url?: string
}

interface CryptoPayResponse<T> {
  ok: boolean
  result?: T
  error?: { code: number; name: string }
}

function getHeaders(): HeadersInit {
  const apiToken = process.env.CRYPTOPAY_API_TOKEN
  
  if (!apiToken) {
    throw new Error('CryptoPay API token not configured')
  }
  
  return {
    'Crypto-Pay-API-Token': apiToken,
    'Content-Type': 'application/json',
  }
}

export interface CreateCryptoPaymentParams extends CreatePaymentParams {
  asset?: CryptoAsset
  expiresIn?: number // секунды
  allowComments?: boolean
  allowAnonymous?: boolean
  hiddenMessage?: string
}

export async function createCryptoPayPayment(params: CreateCryptoPaymentParams): Promise<PaymentResult> {
  const { 
    amount, 
    currency, 
    userId, 
    description, 
    returnUrl,
    metadata,
    asset = 'USDT',
    expiresIn = 3600, // 1 час
    allowComments = false,
    allowAnonymous = true,
    hiddenMessage,
  } = params
  
  try {
    const payload = JSON.stringify({ userId, ...metadata })
    
    const response = await fetch(`${CRYPTOPAY_API_URL}/createInvoice`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        currency_type: 'crypto',
        asset,
        amount: amount.toString(),
        description: description || 'Balance Top-up',
        hidden_message: hiddenMessage,
        paid_btn_name: 'callback',
        paid_btn_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        payload,
        allow_comments: allowComments,
        allow_anonymous: allowAnonymous,
        expires_in: expiresIn,
      }),
    })
    
    const data: CryptoPayResponse<CryptoPayInvoice> = await response.json()
    
    if (!data.ok || !data.result) {
      throw new Error(data.error?.name || 'CryptoPay payment error')
    }
    
    const invoice = data.result
    
    return {
      success: true,
      paymentId: invoice.invoice_id.toString(),
      paymentUrl: invoice.mini_app_invoice_url || invoice.pay_url,
      status: 'pending',
    }
  } catch (error) {
    console.error('CryptoPay payment error:', error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getCryptoPayInvoice(invoiceId: string): Promise<CryptoPayInvoice | null> {
  try {
    const response = await fetch(`${CRYPTOPAY_API_URL}/getInvoices?invoice_ids=${invoiceId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    const data: CryptoPayResponse<{ items: CryptoPayInvoice[] }> = await response.json()
    
    if (!data.ok || !data.result?.items?.length) return null
    
    return data.result.items[0]
  } catch (error) {
    console.error('CryptoPay get invoice error:', error)
    return null
  }
}

export async function getCryptoPayBalance(): Promise<Record<string, string> | null> {
  try {
    const response = await fetch(`${CRYPTOPAY_API_URL}/getBalance`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    const data: CryptoPayResponse<Array<{ currency_code: string; available: string }>> = await response.json()
    
    if (!data.ok || !data.result) return null
    
    return Object.fromEntries(
      data.result.map(item => [item.currency_code, item.available])
    )
  } catch (error) {
    console.error('CryptoPay get balance error:', error)
    return null
  }
}

export async function getExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(`${CRYPTOPAY_API_URL}/getExchangeRates`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    const data: CryptoPayResponse<Array<{ source: string; target: string; rate: string }>> = await response.json()
    
    if (!data.ok || !data.result) return null
    
    // Возвращаем курсы к USD
    return Object.fromEntries(
      data.result
        .filter(item => item.target === 'USD')
        .map(item => [item.source, parseFloat(item.rate)])
    )
  } catch (error) {
    console.error('CryptoPay get exchange rates error:', error)
    return null
  }
}

export function verifyCryptoPayWebhook(body: string, signature: string): boolean {
  const apiToken = process.env.CRYPTOPAY_API_TOKEN
  
  if (!apiToken) {
    console.error('CryptoPay API token not configured')
    return false
  }
  
  try {
    const crypto = require('crypto')
    
    // CryptoPay использует SHA256 HMAC
    const secret = crypto.createHash('sha256').update(apiToken).digest()
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// Получить список доступных криптовалют
export async function getAvailableCurrencies(): Promise<CryptoAsset[]> {
  try {
    const response = await fetch(`${CRYPTOPAY_API_URL}/getCurrencies`, {
      method: 'GET',
      headers: getHeaders(),
    })
    
    const data: CryptoPayResponse<Array<{ code: string; name: string }>> = await response.json()
    
    if (!data.ok || !data.result) return ['USDT', 'TON', 'BTC']
    
    return data.result.map(c => c.code as CryptoAsset)
  } catch {
    return ['USDT', 'TON', 'BTC']
  }
}
