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

// GET - Список локаций
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { servers: true },
        },
      },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("Admin get locations error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении локаций" },
      { status: 500 }
    )
  }
}

// POST - Создать локацию
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { name, country, city, flag, isActive } = body

    if (!name || !country) {
      return NextResponse.json(
        { error: "Заполните обязательные поля" },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        name,
        country,
        city,
        flag: flag || "🌍",
        isActive: isActive ?? true,
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "CREATE_LOCATION",
        target: location.id,
        details: JSON.stringify({ name: location.name }),
      },
    })

    return NextResponse.json({
      success: true,
      location,
    })
  } catch (error) {
    console.error("Admin create location error:", error)
    return NextResponse.json(
      { error: "Ошибка при создании локации" },
      { status: 500 }
    )
  }
}
