import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "30d"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    
    // Calculate date range
    let startDate: Date
    let endDate = dateTo ? new Date(dateTo) : new Date()
    
    if (dateFrom) {
      startDate = new Date(dateFrom)
    } else {
      const periodDays: Record<string, number> = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "365d": 365,
        "all": 3650,
      }
      const days = periodDays[period] || 30
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    }
    
    // Previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodLength)
    const prevEndDate = startDate
    
    // Get transactions for current period
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: PaymentStatus.COMPLETED,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })
    
    // Get transactions for previous period
    const prevTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: PaymentStatus.COMPLETED,
      },
    })
    
    // Calculate current period stats
    const deposits = transactions.filter(t => t.type === TransactionType.DEPOSIT && t.amount > 0)
    const refunds = transactions.filter(t => t.type === TransactionType.REFUND)
    const purchases = transactions.filter(t => t.type === TransactionType.PURCHASE)
    
    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = refunds.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalPurchases = purchases.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalRevenue = totalDeposits
    const netRevenue = totalDeposits - totalRefunds
    
    // Calculate previous period revenue
    const prevDeposits = prevTransactions
      .filter(t => t.type === TransactionType.DEPOSIT && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Growth calculation
    const growth = prevDeposits > 0 ? ((totalDeposits - prevDeposits) / prevDeposits) * 100 : 0
    
    // MRR calculation (average daily revenue * 30)
    const daysInPeriod = Math.ceil(periodLength / (24 * 60 * 60 * 1000))
    const avgDailyRevenue = totalDeposits / daysInPeriod
    const mrr = avgDailyRevenue * 30
    const arr = mrr * 12
    
    // Average transaction value
    const avgTransactionValue = deposits.length > 0 
      ? totalDeposits / deposits.length 
      : 0
    
    // Revenue by day
    const revenueByDayMap = new Map<string, { deposits: number; refunds: number; revenue: number }>()
    
    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().split("T")[0]
      const existing = revenueByDayMap.get(dateKey) || { deposits: 0, refunds: 0, revenue: 0 }
      
      if (tx.type === TransactionType.DEPOSIT && tx.amount > 0) {
        existing.deposits += tx.amount
        existing.revenue += tx.amount
      } else if (tx.type === TransactionType.REFUND) {
        existing.refunds += Math.abs(tx.amount)
        existing.revenue -= Math.abs(tx.amount)
      }
      
      revenueByDayMap.set(dateKey, existing)
    }
    
    const revenueByDay = Array.from(revenueByDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Revenue by month
    const revenueByMonthMap = new Map<string, { deposits: number; refunds: number; revenue: number }>()
    
    for (const tx of transactions) {
      const monthKey = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`
      const existing = revenueByMonthMap.get(monthKey) || { deposits: 0, refunds: 0, revenue: 0 }
      
      if (tx.type === TransactionType.DEPOSIT && tx.amount > 0) {
        existing.deposits += tx.amount
        existing.revenue += tx.amount
      } else if (tx.type === TransactionType.REFUND) {
        existing.refunds += Math.abs(tx.amount)
        existing.revenue -= Math.abs(tx.amount)
      }
      
      revenueByMonthMap.set(monthKey, existing)
    }
    
    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // Payment methods statistics
    const paymentMethodsMap = new Map<string, { count: number; amount: number }>()
    
    for (const tx of deposits) {
      const method = tx.paymentMethod || "Неизвестно"
      const existing = paymentMethodsMap.get(method) || { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += tx.amount
      paymentMethodsMap.set(method, existing)
    }
    
    const paymentMethods = Array.from(paymentMethodsMap.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.amount - a.amount)
    
    // Transaction types statistics
    const typeLabels: Record<string, string> = {
      DEPOSIT: "Пополнение",
      WITHDRAWAL: "Вывод",
      PURCHASE: "Покупка",
      REFUND: "Возврат",
      REFERRAL: "Реферал",
      PROMOCODE: "Промокод",
      BONUS: "Бонус",
    }
    
    const transactionTypesMap = new Map<string, { count: number; amount: number }>()
    
    for (const tx of transactions) {
      const type = typeLabels[tx.type] || tx.type
      const existing = transactionTypesMap.get(type) || { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += Math.abs(tx.amount)
      transactionTypesMap.set(type, existing)
    }
    
    const transactionTypes = Array.from(transactionTypesMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
    
    // Top users by spending
    const userSpendingMap = new Map<string, { 
      id: string
      email: string
      name: string | null
      totalSpent: number
      transactionCount: number 
    }>()
    
    for (const tx of deposits) {
      const userId = tx.userId
      const existing = userSpendingMap.get(userId) || {
        id: userId,
        email: tx.user.email,
        name: tx.user.name,
        totalSpent: 0,
        transactionCount: 0,
      }
      existing.totalSpent += tx.amount
      existing.transactionCount += 1
      userSpendingMap.set(userId, existing)
    }
    
    const topUsers = Array.from(userSpendingMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
    
    // Hourly distribution
    const hourlyMap = new Map<number, { count: number; amount: number }>()
    
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { count: 0, amount: 0 })
    }
    
    for (const tx of deposits) {
      const hour = tx.createdAt.getHours()
      const existing = hourlyMap.get(hour)!
      existing.count += 1
      existing.amount += tx.amount
    }
    
    const hourlyDistribution = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
    
    // New users in period
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false,
      },
    })
    
    // Churned users (no activity in 30+ days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const churnedUsers = await prisma.user.count({
      where: {
        isDeleted: false,
        OR: [
          { lastLoginAt: { lt: thirtyDaysAgo } },
          { lastLoginAt: null },
        ],
        createdAt: { lt: thirtyDaysAgo },
      },
    })
    
    return NextResponse.json({
      summary: {
        totalRevenue,
        totalDeposits,
        totalRefunds,
        netRevenue,
        mrr,
        arr,
        avgTransactionValue,
        transactionCount: transactions.length,
        newUsers,
        churnedUsers,
        growth,
      },
      revenueByDay,
      revenueByMonth,
      paymentMethods,
      transactionTypes,
      topUsers,
      hourlyDistribution,
    })
    
  } catch (error: unknown) {
    console.error("Financial report error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки отчёта" },
      { status: 500 }
    )
  }
}
