import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить данные для дашборда аналитики
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

    // Вычисляем даты
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "365d":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // Всё время
    }

    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))

    // ==================== REVENUE ====================
    const currentRevenue = await prisma.transaction.aggregate({
      where: {
        type: "DEPOSIT",
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    })

    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        type: "DEPOSIT",
        status: "COMPLETED",
        createdAt: { gte: previousStartDate, lt: startDate },
      },
      _sum: { amount: true },
    })

    const totalRevenue = currentRevenue._sum.amount || 0
    const prevRevenue = previousRevenue._sum.amount || 0
    const revenueGrowth = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : 100

    // Ежемесячный доход
    const monthlyRevenue = await prisma.$queryRaw<{ month: string; amount: number }[]>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM(amount)::float as amount
      FROM transactions
      WHERE type = 'DEPOSIT' AND status = 'COMPLETED' AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `

    // ==================== USERS ====================
    const totalUsers = await prisma.user.count()
    
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    })

    const previousNewUsers = await prisma.user.count({
      where: { createdAt: { gte: previousStartDate, lt: startDate } },
    })

    const usersGrowth = previousNewUsers > 0 
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 
      : 100

    // Активные пользователи (заходили за последние 30 дней)
    const activeUsers = await prisma.user.count({
      where: { lastLoginAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    })

    // Регистрации по дням
    const registrations = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT 
        TO_CHAR("createdAt", 'DD.MM') as date,
        COUNT(*)::int as count
      FROM users
      WHERE "createdAt" >= ${startDate}
      GROUP BY TO_CHAR("createdAt", 'DD.MM'), DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
      LIMIT 30
    `

    // ==================== SERVERS ====================
    const totalServers = await prisma.server.count()
    
    const activeServers = await prisma.server.count({
      where: { status: "ACTIVE" },
    })

    const serversByPlan = await prisma.server.groupBy({
      by: ["planId"],
      _count: true,
    })

    const plans = await prisma.plan.findMany({
      select: { id: true, name: true },
    })

    const byPlan = serversByPlan.map(s => ({
      name: plans.find(p => p.id === s.planId)?.name || "Unknown",
      count: s._count,
    }))

    const serversByLocation = await prisma.server.groupBy({
      by: ["locationId"],
      _count: true,
    })

    const locations = await prisma.location.findMany({
      select: { id: true, name: true },
    })

    const byLocation = serversByLocation
      .filter(s => s.locationId)
      .map(s => ({
        name: locations.find(l => l.id === s.locationId)?.name || "Unknown",
        count: s._count,
      }))

    // ==================== TICKETS ====================
    const totalTickets = await prisma.ticket.count({
      where: { createdAt: { gte: startDate } },
    })

    const openTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    })

    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ["status"],
      _count: true,
      where: { createdAt: { gte: startDate } },
    })

    const byStatus = ticketsByStatus.map(t => ({
      status: t.status,
      count: t._count,
    }))

    // ==================== FUNNEL ====================
    // Посетители (примерно - из логинов за период)
    const visitors = await prisma.loginHistory.count({
      where: { createdAt: { gte: startDate } },
    }) * 5 // Примерно 20% заходят в аккаунт

    const registered = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    })

    const firstPayment = await prisma.transaction.groupBy({
      by: ["userId"],
      where: {
        type: "DEPOSIT",
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
    })

    const activeClients = await prisma.server.groupBy({
      by: ["userId"],
      where: { status: "ACTIVE" },
    })

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        growth: revenueGrowth,
      },
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        growth: usersGrowth,
        registrations,
      },
      servers: {
        total: totalServers,
        active: activeServers,
        byPlan,
        byLocation,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        avgResponseTime: 2.5, // TODO: вычислить реально
        byStatus,
      },
      funnel: {
        visitors: Math.max(visitors, registered * 5),
        registered,
        firstPayment: firstPayment.length,
        active: activeClients.length,
      },
    })
  } catch (error) {
    console.error("Analytics dashboard error:", error)
    return NextResponse.json(
      { error: "Ошибка загрузки аналитики" },
      { status: 500 }
    )
  }
}
