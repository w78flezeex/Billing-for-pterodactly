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

// POST - Дублировать тариф
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    // Получаем оригинальный тариф
    const originalPlan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        locations: true,
      },
    })

    if (!originalPlan) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 })
    }

    // Создаём копию
    const newPlan = await prisma.plan.create({
      data: {
        name: `${originalPlan.name} (копия)`,
        description: originalPlan.description,
        type: originalPlan.type,
        price: originalPlan.price,
        priceYearly: originalPlan.priceYearly,
        features: originalPlan.features as string[],
        specs: originalPlan.specs as object,
        isActive: false, // Копия неактивна по умолчанию
        isPopular: false,
        sortOrder: originalPlan.sortOrder + 1,
        pterodactylNestId: originalPlan.pterodactylNestId,
        pterodactylEggId: originalPlan.pterodactylEggId,
      },
    })

    // Копируем локации
    if (originalPlan.locations.length > 0) {
      await prisma.planLocation.createMany({
        data: originalPlan.locations.map((loc) => ({
          planId: newPlan.id,
          locationId: loc.locationId,
          stock: loc.stock,
        })),
      })
    }

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "DUPLICATE_PLAN",
        target: newPlan.id,
        details: JSON.stringify({ 
          originalId: originalPlan.id,
          originalName: originalPlan.name,
          newName: newPlan.name,
        }),
      },
    })

    // Возвращаем новый тариф с локациями
    const planWithLocations = await prisma.plan.findUnique({
      where: { id: newPlan.id },
      include: {
        locations: {
          include: {
            location: true,
          },
        },
        _count: {
          select: { servers: true, orders: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      plan: planWithLocations,
    })
  } catch (error) {
    console.error("Duplicate plan error:", error)
    return NextResponse.json(
      { error: "Ошибка при дублировании тарифа" },
      { status: 500 }
    )
  }
}
