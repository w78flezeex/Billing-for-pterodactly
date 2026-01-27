import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// Проверка админ-прав
async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Не авторизован", status: 401 }
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  
  if (dbUser?.role !== "ADMIN") {
    return { error: "Нет доступа", status: 403 }
  }
  
  return { user }
}

// GET - Статистика для дашборда
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Общая статистика
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalServers,
      activeServers,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      openTickets,
      totalTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.server.count(),
      prisma.server.count({
        where: { status: "ACTIVE" },
      }),
      prisma.transaction.aggregate({
        where: {
          type: { in: ["DEPOSIT", "PURCHASE"] },
          status: "COMPLETED",
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: { in: ["DEPOSIT", "PURCHASE"] },
          status: "COMPLETED",
          amount: { gt: 0 },
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: { in: ["DEPOSIT", "PURCHASE"] },
          status: "COMPLETED",
          amount: { gt: 0 },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      prisma.ticket.count({
        where: { status: { in: ["OPEN", "WAITING"] } },
      }),
      prisma.transaction.count({
        where: { status: "COMPLETED" },
      }),
    ])

    // Активность за последние 7 дней
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = await prisma.transaction.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    })

    // Последние пользователи
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { servers: true },
        },
      },
    })

    // Последние транзакции
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    })

    // Серверы по статусу
    const serversByStatus = await prisma.server.groupBy({
      by: ["status"],
      _count: true,
    })

    // Использование промокодов
    const promocodeStats = await prisma.promocodeUsage.aggregate({
      _sum: { amount: true },
      _count: true,
    })

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          growth: newUsersLastMonth > 0 
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : 100,
        },
        servers: {
          total: totalServers,
          active: activeServers,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          thisMonth: revenueThisMonth._sum.amount || 0,
          lastMonth: revenueLastMonth._sum.amount || 0,
          growth: (revenueLastMonth._sum.amount || 0) > 0
            ? (((revenueThisMonth._sum.amount || 0) - (revenueLastMonth._sum.amount || 0)) / (revenueLastMonth._sum.amount || 1) * 100).toFixed(1)
            : 100,
        },
        tickets: {
          open: openTickets,
        },
        transactions: {
          total: totalTransactions,
        },
        promocodes: {
          totalUsed: promocodeStats._count,
          totalDiscount: promocodeStats._sum.amount || 0,
        },
      },
      serversByStatus: serversByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      recentUsers,
      recentTransactions,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении статистики" },
      { status: 500 }
    )
  }
}
