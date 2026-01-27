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
    select: { role: true, id: true },
  })
  
  if (dbUser?.role !== "ADMIN") {
    return { error: "Нет доступа", status: 403 }
  }
  
  return { user: dbUser }
}

// GET - Список промокодов
export async function GET(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const promocodes = await prisma.promocode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    return NextResponse.json({ promocodes })
  } catch (error) {
    console.error("Admin get promocodes error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении промокодов" },
      { status: 500 }
    )
  }
}

// POST - Создать промокод
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { code, type, value, minAmount, maxUses, maxUsesPerUser, expiresAt, applicablePlanIds } = body

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Заполните обязательные поля" },
        { status: 400 }
      )
    }

    // Проверяем уникальность кода
    const existing = await prisma.promocode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Промокод с таким кодом уже существует" },
        { status: 400 }
      )
    }

    const promocode = await prisma.promocode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minAmount: minAmount || null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || 1,
        validUntil: expiresAt ? new Date(expiresAt) : null,
        planTypes: applicablePlanIds || [],
        isActive: true,
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "CREATE_PROMOCODE",
        target: promocode.id,
        details: JSON.stringify({ code: promocode.code }),
      },
    })

    return NextResponse.json({
      success: true,
      promocode,
    })
  } catch (error) {
    console.error("Admin create promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при создании промокода" },
      { status: 500 }
    )
  }
}
