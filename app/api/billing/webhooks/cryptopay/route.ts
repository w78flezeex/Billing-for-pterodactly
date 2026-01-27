/**
 * Webhook для CryptoPay (@send bot)
 * POST /api/billing/webhooks/cryptopay
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment, failPayment } from '@/lib/payments'
import { verifyCryptoPayWebhook } from '@/lib/payments/cryptopay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('crypto-pay-api-signature') || ''
    
    // Верификация вебхука
    if (!verifyCryptoPayWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const payload = JSON.parse(body)
    const { update_type, payload: invoiceData } = payload
    
    if (!invoiceData?.invoice_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    
    const invoiceId = invoiceData.invoice_id.toString()
    
    switch (update_type) {
      case 'invoice_paid':
        await confirmPayment(invoiceId, 'cryptopay')
        console.log(`CryptoPay invoice ${invoiceId} paid`)
        break
        
      case 'invoice_expired':
        await failPayment(invoiceId, 'cryptopay', 'Invoice expired')
        console.log(`CryptoPay invoice ${invoiceId} expired`)
        break
        
      default:
        console.log(`CryptoPay webhook update_type: ${update_type}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CryptoPay webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
