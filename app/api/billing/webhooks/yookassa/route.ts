/**
 * Webhook для YooKassa
 * POST /api/billing/webhooks/yookassa
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment, failPayment } from '@/lib/payments'
import { getYooKassaPayment, verifyYooKassaWebhook } from '@/lib/payments/yookassa'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('signature') || ''
    
    // Верификация вебхука (в продакшене проверяем IP)
    // const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    // YooKassa IP ranges: 185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.156.11, 77.75.156.35
    
    const payload = JSON.parse(body)
    const { event, object } = payload
    
    if (!object?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    
    const paymentId = object.id
    
    switch (event) {
      case 'payment.succeeded':
        await confirmPayment(paymentId, 'yookassa')
        console.log(`YooKassa payment ${paymentId} confirmed`)
        break
        
      case 'payment.canceled':
        await failPayment(paymentId, 'yookassa', 'Payment cancelled')
        console.log(`YooKassa payment ${paymentId} cancelled`)
        break
        
      case 'payment.waiting_for_capture':
        // Можно автоматически подтвердить capture
        console.log(`YooKassa payment ${paymentId} waiting for capture`)
        break
        
      case 'refund.succeeded':
        // Обработка возврата
        console.log(`YooKassa refund for ${paymentId} succeeded`)
        break
        
      default:
        console.log(`YooKassa webhook event: ${event}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('YooKassa webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
