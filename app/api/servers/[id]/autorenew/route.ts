/**
 * API для управления автопродлением сервера
 * POST /api/servers/[id]/autorenew
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { toggleAutoRenew } from '@/lib/server-renewal'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { enabled } = body as { enabled: boolean }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Укажите enabled: true или false' },
        { status: 400 }
      )
    }

    const server = await toggleAutoRenew(id, auth.id, enabled)

    return NextResponse.json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        autoRenew: server.autoRenew,
      },
    })
  } catch (error) {
    console.error('Toggle auto-renew error:', error)
    
    if (error instanceof Error && error.message === 'Server not found') {
      return NextResponse.json({ error: 'Сервер не найден' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
