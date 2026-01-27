import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Get all settings data (plans, locations, promocodes stats)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const [plans, locations, promocodes, systemStats] = await Promise.all([
      prisma.plan.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { servers: true, orders: true } },
        },
      }),
      prisma.location.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { servers: true } },
        },
      }),
      prisma.promocode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { usages: true } },
        },
      }),
      // System stats
      Promise.all([
        prisma.user.count(),
        prisma.server.count(),
        prisma.ticket.count({ where: { status: { in: ["OPEN", "WAITING"] } } }),
        prisma.transaction.aggregate({
          where: { type: "DEPOSIT", status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]),
    ])

    return NextResponse.json({
      plans,
      locations,
      promocodes,
      systemStats: {
        totalUsers: systemStats[0],
        totalServers: systemStats[1],
        openTickets: systemStats[2],
        totalDeposits: systemStats[3]._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
