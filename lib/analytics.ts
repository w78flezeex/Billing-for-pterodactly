/**
 * Расширенная аналитика для биллинга
 * LTV, когорты, прогнозы, графики
 */

import prisma from './db'
import { TransactionType, PaymentStatus, ServerStatus } from '@prisma/client'

interface DateRange {
  start: Date
  end: Date
}

interface RevenueData {
  date: string
  revenue: number
  transactions: number
}

interface UserCohort {
  cohort: string // YYYY-MM
  totalUsers: number
  retainedMonth1: number
  retainedMonth2: number
  retainedMonth3: number
  totalRevenue: number
  avgRevenue: number
}

interface LTVData {
  userId: string
  email: string
  name?: string | null
  registeredAt: Date
  totalSpent: number
  totalDeposited: number
  serverCount: number
  ticketCount: number
  lastActivity?: Date
  predictedLTV: number
  segment: 'high' | 'medium' | 'low' | 'churned'
}

/**
 * Получить доходы по дням/месяцам
 */
export async function getRevenueTimeline(
  period: 'day' | 'week' | 'month',
  range?: DateRange
): Promise<RevenueData[]> {
  const now = new Date()
  const start = range?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const end = range?.end || now
  
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      type: { in: [TransactionType.DEPOSIT, TransactionType.PURCHASE] },
      status: PaymentStatus.COMPLETED,
      amount: { gt: 0 },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  
  // Группируем по периоду
  const grouped = new Map<string, { revenue: number; count: number }>()
  
  for (const tx of transactions) {
    let key: string
    const date = new Date(tx.createdAt)
    
    if (period === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (period === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    
    const current = grouped.get(key) || { revenue: 0, count: 0 }
    current.revenue += tx.amount
    current.count += 1
    grouped.set(key, current)
  }
  
  return Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Расчёт LTV пользователей
 */
export async function calculateUserLTV(): Promise<LTVData[]> {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          servers: true,
          tickets: true,
        },
      },
      transactions: {
        where: { status: PaymentStatus.COMPLETED },
        select: {
          type: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  })
  
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  return users.map(user => {
    const deposits = user.transactions
      .filter(t => t.type === TransactionType.DEPOSIT && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const spent = user.transactions
      .filter(t => t.type === TransactionType.PURCHASE)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const lastTransaction = user.transactions.length > 0
      ? new Date(Math.max(...user.transactions.map(t => new Date(t.createdAt).getTime())))
      : null
    
    const lastActivity = lastTransaction || user.lastLoginAt || user.createdAt
    
    // Расчёт месяцев с регистрации
    const monthsSinceRegistration = Math.max(
      1,
      (now.getTime() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
    )
    
    // Среднемесячный доход
    const monthlyRevenue = deposits / monthsSinceRegistration
    
    // Прогноз LTV на 12 месяцев
    const predictedLTV = monthlyRevenue * 12
    
    // Сегментация
    let segment: 'high' | 'medium' | 'low' | 'churned'
    if (new Date(lastActivity) < thirtyDaysAgo) {
      segment = 'churned'
    } else if (monthlyRevenue > 5000) {
      segment = 'high'
    } else if (monthlyRevenue > 1000) {
      segment = 'medium'
    } else {
      segment = 'low'
    }
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      registeredAt: user.createdAt,
      totalSpent: spent,
      totalDeposited: deposits,
      serverCount: user._count.servers,
      ticketCount: user._count.tickets,
      lastActivity: lastActivity ? new Date(lastActivity) : undefined,
      predictedLTV,
      segment,
    }
  }).sort((a, b) => b.predictedLTV - a.predictedLTV)
}

/**
 * Когортный анализ
 */
export async function getCohortAnalysis(months: number = 6): Promise<UserCohort[]> {
  const now = new Date()
  const cohorts: UserCohort[] = []
  
  for (let i = months - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const cohortKey = `${cohortStart.getFullYear()}-${String(cohortStart.getMonth() + 1).padStart(2, '0')}`
    
    // Пользователи зарегистрированные в этом месяце
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: cohortStart, lte: cohortEnd },
        isDeleted: false,
      },
      select: {
        id: true,
        transactions: {
          where: { status: PaymentStatus.COMPLETED },
          select: { amount: true, createdAt: true },
        },
      },
    })
    
    const totalUsers = users.length
    if (totalUsers === 0) {
      cohorts.push({
        cohort: cohortKey,
        totalUsers: 0,
        retainedMonth1: 0,
        retainedMonth2: 0,
        retainedMonth3: 0,
        totalRevenue: 0,
        avgRevenue: 0,
      })
      continue
    }
    
    // Подсчёт retention
    let retainedMonth1 = 0
    let retainedMonth2 = 0
    let retainedMonth3 = 0
    let totalRevenue = 0
    
    const month1Start = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + 1, 1)
    const month2Start = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + 2, 1)
    const month3Start = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + 3, 1)
    
    for (const user of users) {
      const userRevenue = user.transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      totalRevenue += userRevenue
      
      // Проверяем активность в последующих месяцах
      const hasMonth1Activity = user.transactions.some(t => 
        new Date(t.createdAt) >= month1Start && new Date(t.createdAt) < month2Start
      )
      const hasMonth2Activity = user.transactions.some(t => 
        new Date(t.createdAt) >= month2Start && new Date(t.createdAt) < month3Start
      )
      const hasMonth3Activity = user.transactions.some(t => 
        new Date(t.createdAt) >= month3Start
      )
      
      if (hasMonth1Activity) retainedMonth1++
      if (hasMonth2Activity) retainedMonth2++
      if (hasMonth3Activity) retainedMonth3++
    }
    
    cohorts.push({
      cohort: cohortKey,
      totalUsers,
      retainedMonth1: Math.round((retainedMonth1 / totalUsers) * 100),
      retainedMonth2: Math.round((retainedMonth2 / totalUsers) * 100),
      retainedMonth3: Math.round((retainedMonth3 / totalUsers) * 100),
      totalRevenue,
      avgRevenue: Math.round(totalRevenue / totalUsers),
    })
  }
  
  return cohorts
}

/**
 * Статистика по серверам
 */
export async function getServerStats() {
  const [
    statusCounts,
    planCounts,
    locationCounts,
    expiringServers,
  ] = await Promise.all([
    // По статусам
    prisma.server.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    // По тарифам
    prisma.server.groupBy({
      by: ['planId'],
      _count: { id: true },
    }),
    // По локациям
    prisma.server.groupBy({
      by: ['locationId'],
      _count: { id: true },
    }),
    // Истекающие в ближайшие 7 дней
    prisma.server.count({
      where: {
        status: ServerStatus.ACTIVE,
        expiresAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gt: new Date(),
        },
      },
    }),
  ])
  
  // Получаем названия тарифов и локаций
  const plans = await prisma.plan.findMany({
    where: { id: { in: planCounts.map(p => p.planId) } },
    select: { id: true, name: true },
  })
  
  const locations = await prisma.location.findMany({
    where: { id: { in: locationCounts.filter(l => l.locationId).map(l => l.locationId!) } },
    select: { id: true, name: true, flag: true },
  })
  
  return {
    byStatus: statusCounts.map(s => ({
      status: s.status,
      count: s._count.id,
    })),
    byPlan: planCounts.map(p => ({
      planId: p.planId,
      planName: plans.find(pl => pl.id === p.planId)?.name || 'Unknown',
      count: p._count.id,
    })),
    byLocation: locationCounts.map(l => ({
      locationId: l.locationId,
      locationName: locations.find(loc => loc.id === l.locationId)?.name || 'Unknown',
      flag: locations.find(loc => loc.id === l.locationId)?.flag || '🌍',
      count: l._count.id,
    })),
    expiringServers,
  }
}

/**
 * Прогноз выручки на следующий месяц
 */
export async function getRevenueForecast(): Promise<{
  predictedRevenue: number
  confidence: number
  factors: string[]
}> {
  // Получаем данные за последние 3 месяца
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  const recentTransactions = await prisma.transaction.aggregate({
    where: {
      createdAt: { gte: threeMonthsAgo },
      type: { in: [TransactionType.DEPOSIT, TransactionType.PURCHASE] },
      status: PaymentStatus.COMPLETED,
      amount: { gt: 0 },
    },
    _sum: { amount: true },
    _count: { id: true },
  })
  
  // Получаем кол-во активных серверов
  const activeServers = await prisma.server.count({
    where: { status: ServerStatus.ACTIVE },
  })
  
  // Получаем средний чек
  const avgServerPrice = await prisma.plan.aggregate({
    where: { isActive: true },
    _avg: { price: true },
  })
  
  // Простой прогноз на основе recurring revenue
  const monthlyRecurring = activeServers * (avgServerPrice._avg?.price || 500)
  
  // Добавляем рост на основе тренда
  const avgMonthlyRevenue = (recentTransactions._sum?.amount || 0) / 3
  const growthFactor = avgMonthlyRevenue > 0 ? (monthlyRecurring / avgMonthlyRevenue) : 1
  
  const predictedRevenue = Math.round(monthlyRecurring * Math.min(growthFactor, 1.2))
  
  const factors: string[] = []
  if (activeServers > 0) {
    factors.push(`${activeServers} активных серверов`)
  }
  if (avgMonthlyRevenue > predictedRevenue) {
    factors.push('Снижение дохода относительно среднего')
  } else {
    factors.push('Рост дохода относительно среднего')
  }
  
  return {
    predictedRevenue,
    confidence: 0.7, // 70% confidence
    factors,
  }
}

/**
 * Сводка для дашборда аналитики
 */
export async function getAnalyticsSummary() {
  const [
    revenueToday,
    revenueThisMonth,
    newUsersToday,
    newUsersThisMonth,
    activeServers,
    forecast,
  ] = await Promise.all([
    // Доход за сегодня
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        type: TransactionType.DEPOSIT,
        status: PaymentStatus.COMPLETED,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    }),
    // Доход за месяц
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        type: TransactionType.DEPOSIT,
        status: PaymentStatus.COMPLETED,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    }),
    // Новые пользователи сегодня
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    // Новые пользователи за месяц
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    // Активные серверы
    prisma.server.count({
      where: { status: ServerStatus.ACTIVE },
    }),
    // Прогноз
    getRevenueForecast(),
  ])
  
  return {
    revenue: {
      today: revenueToday._sum?.amount || 0,
      thisMonth: revenueThisMonth._sum?.amount || 0,
    },
    users: {
      today: newUsersToday,
      thisMonth: newUsersThisMonth,
    },
    servers: {
      active: activeServers,
    },
    forecast,
  }
}
