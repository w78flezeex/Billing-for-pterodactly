/**
 * Webhook для PayPal
 * POST /api/billing/webhooks/paypal
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment, failPayment } from '@/lib/payments'
import { capturePayPalPayment } from '@/lib/payments/paypal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)
    
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        const orderId = event.resource?.id
        if (orderId) {
          // Захватываем платеж
          const captured = await capturePayPalPayment(orderId)
          if (captured) {
            await confirmPayment(orderId, 'paypal')
            console.log(`PayPal order ${orderId} captured and confirmed`)
          }
        }
        break
      }
      
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id
        if (orderId) {
          await confirmPayment(orderId, 'paypal')
          console.log(`PayPal payment for order ${orderId} completed`)
        }
        break
      }
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id
        if (orderId) {
          await failPayment(orderId, 'paypal', 'Payment declined')
          console.log(`PayPal payment for order ${orderId} declined`)
        }
        break
      }
      
      default:
        console.log(`PayPal webhook event: ${event.event_type}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
