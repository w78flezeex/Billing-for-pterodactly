/**
 * API для инвойсов пользователя
 * GET /api/billing/invoices - список инвойсов
 * GET /api/billing/invoices/[number] - получить инвойс
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserInvoices } from '@/lib/invoices'

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const invoices = await getUserInvoices(auth.id)

    return NextResponse.json({
      invoices: invoices.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount,
        tax: inv.tax,
        status: inv.status,
        description: inv.description,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
