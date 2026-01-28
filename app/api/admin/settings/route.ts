import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// Helper to get setting by key
async function getSetting(key: string) {
  const setting = await prisma.setting.findUnique({ where: { key } })
  return setting?.value || null
}

// Helper to set setting
async function setSetting(key: string, value: any) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

// GET - Get all settings data (plans, locations, promocodes stats, system settings)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const [plans, locations, promocodes, systemStats, allSettings] = await Promise.all([
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
      // Get all settings
      prisma.setting.findMany(),
    ])

    // Convert settings array to object
    const settings: Record<string, any> = {}
    for (const setting of allSettings) {
      settings[setting.key] = setting.value
    }

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
      // Settings by category
      site: settings.site || null,
      smtp: settings.smtp || null,
      notifications: settings.notifications || null,
      security: settings.security || null,
      pterodactyl: settings.pterodactyl || null,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    const allowedTypes = ["site", "smtp", "notifications", "security", "pterodactyl", "payments"]
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Неверный тип настроек" }, { status: 400 })
    }

    // Save setting
    await setSetting(type, data)

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: "UPDATE_SETTINGS",
        target: type,
        details: JSON.stringify({ type, updated: Object.keys(data) }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 })
  }
}
