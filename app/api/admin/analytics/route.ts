/**
 * API для аналитики (только для админов)
 * GET /api/admin/analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/db'
import {
  getRevenueTimeline,
  calculateUserLTV,
  getCohortAnalysis,
  getServerStats,
  getAnalyticsSummary,
} from '@/lib/analytics'

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
    const type = url.searchParams.get('type') || 'summary'
    const period = url.searchParams.get('period') as 'day' | 'week' | 'month' || 'day'

    switch (type) {
      case 'summary':
        const summary = await getAnalyticsSummary()
        return NextResponse.json(summary)

      case 'revenue':
        const revenue = await getRevenueTimeline(period)
        return NextResponse.json({ data: revenue })

      case 'ltv':
        const ltv = await calculateUserLTV()
        return NextResponse.json({ 
          data: ltv.slice(0, 100), // Топ 100
          segments: {
            high: ltv.filter(u => u.segment === 'high').length,
            medium: ltv.filter(u => u.segment === 'medium').length,
            low: ltv.filter(u => u.segment === 'low').length,
            churned: ltv.filter(u => u.segment === 'churned').length,
          },
        })

      case 'cohorts':
        const months = parseInt(url.searchParams.get('months') || '6')
        const cohorts = await getCohortAnalysis(months)
        return NextResponse.json({ data: cohorts })

      case 'servers':
        const serverStats = await getServerStats()
        return NextResponse.json(serverStats)

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
