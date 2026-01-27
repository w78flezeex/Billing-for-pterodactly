/**
 * API для получения конкретного инвойса
 * GET /api/billing/invoices/[number] - получить инвойс
 * GET /api/billing/invoices/[number]/html - получить HTML для PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getInvoiceByNumber, generateInvoiceHTML } from '@/lib/invoices'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { number } = await params
    const invoice = await getInvoiceByNumber(number)

    if (!invoice) {
      return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
    }

    // Проверяем, что это инвойс текущего пользователя
    if (invoice.userId !== auth.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // Проверяем, нужен ли HTML для печати
    const url = new URL(request.url)
    if (url.searchParams.get('format') === 'html') {
      const html = generateInvoiceHTML({
        ...invoice,
        items: invoice.items as any[],
      })
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount,
        tax: invoice.tax,
        status: invoice.status,
        description: invoice.description,
        items: invoice.items,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
        user: invoice.user,
      },
    })
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
