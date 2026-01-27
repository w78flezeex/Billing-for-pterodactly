/**
 * API для экспорта данных (только для админов)
 * GET /api/admin/export?type=transactions&format=csv
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/db'
import {
  exportTransactions,
  exportUsers,
  exportServers,
  exportInvoices,
  exportFinancialReport,
} from '@/lib/export'

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'transactions'
    const format = (url.searchParams.get('format') || 'csv') as 'csv' | 'json'
    const dateFrom = url.searchParams.get('from') 
      ? new Date(url.searchParams.get('from')!) 
      : undefined
    const dateTo = url.searchParams.get('to') 
      ? new Date(url.searchParams.get('to')!) 
      : undefined

    const options = { format, dateFrom, dateTo }
    let data: string
    let filename: string

    switch (type) {
      case 'transactions':
        data = await exportTransactions(options)
        filename = `transactions_${new Date().toISOString().split('T')[0]}`
        break

      case 'users':
        data = await exportUsers(options)
        filename = `users_${new Date().toISOString().split('T')[0]}`
        break

      case 'servers':
        data = await exportServers(options)
        filename = `servers_${new Date().toISOString().split('T')[0]}`
        break

      case 'invoices':
        data = await exportInvoices(options)
        filename = `invoices_${new Date().toISOString().split('T')[0]}`
        break

      case 'financial':
        data = await exportFinancialReport(options)
        filename = `financial_report_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({ error: 'Unknown export type' }, { status: 400 })
    }

    const contentType = format === 'json' 
      ? 'application/json' 
      : 'text/csv; charset=utf-8'
    
    const extension = format === 'json' ? 'json' : 'csv'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${extension}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
