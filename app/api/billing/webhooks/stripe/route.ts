/**
 * Webhook для Stripe
 * POST /api/billing/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment, failPayment } from '@/lib/payments'
import { verifyStripeWebhook } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''
    
    // Верификация вебхука
    if (process.env.STRIPE_WEBHOOK_SECRET && !verifyStripeWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const event = JSON.parse(body)
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.payment_status === 'paid') {
          await confirmPayment(session.id, 'stripe')
          console.log(`Stripe payment ${session.id} confirmed`)
        }
        break
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object
        await failPayment(session.id, 'stripe', 'Session expired')
        console.log(`Stripe session ${session.id} expired`)
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        await failPayment(paymentIntent.id, 'stripe', paymentIntent.last_payment_error?.message)
        console.log(`Stripe payment ${paymentIntent.id} failed`)
        break
      }
      
      default:
        console.log(`Stripe webhook event: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
