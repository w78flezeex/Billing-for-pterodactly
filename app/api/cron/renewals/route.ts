/**
 * API для Cron Jobs
 * Защищен секретным ключом
 * GET /api/cron/renewals
 */

import { NextRequest, NextResponse } from 'next/server'
import { processServerRenewals } from '@/lib/server-renewal'

export async function GET(request: NextRequest) {
  try {
    // Проверяем секретный ключ
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Запускаем обработку продлений
    const results = await processServerRenewals()
    
    console.log('Server renewals processed:', results)
    
    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Cron renewals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
