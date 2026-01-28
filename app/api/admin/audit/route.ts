import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return null
  }
  return user
}

// GET - Получить аудит лог
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Record<string, unknown> = {}

    if (userId) where.userId = userId
    if (action) where.action = { contains: action, mode: "insensitive" }
    if (entityType) where.entityType = entityType

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json({ error: "Ошибка получения" }, { status: 500 })
  }
}
