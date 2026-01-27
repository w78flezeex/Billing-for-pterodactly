import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { PlanType } from "@prisma/client"

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

// GET - Список тарифов
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const plans = await prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
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

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Admin get plans error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тарифов" },
      { status: 500 }
    )
  }
}

// POST - Создать тариф
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      type,
      price, 
      priceYearly,
      features, 
      specs,
      isActive, 
      isPopular, 
      sortOrder,
      pterodactylNestId,
      pterodactylEggId,
      locationIds 
    } = body

    if (!name || !type || price === undefined) {
      return NextResponse.json(
        { error: "Заполните обязательные поля (название, тип, цена)" },
        { status: 400 }
      )
    }

    // Validate type
    if (!Object.values(PlanType).includes(type)) {
      return NextResponse.json(
        { error: "Неверный тип тарифа" },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        type: type as PlanType,
        price: parseFloat(price),
        priceYearly: priceYearly ? parseFloat(priceYearly) : null,
        features: features || [],
        specs: specs || {},
        isActive: isActive ?? true,
        isPopular: isPopular ?? false,
        sortOrder: sortOrder ?? 0,
        pterodactylNestId: pterodactylNestId ? parseInt(pterodactylNestId) : null,
        pterodactylEggId: pterodactylEggId ? parseInt(pterodactylEggId) : null,
      },
    })

    // Добавляем локации
    if (locationIds && locationIds.length > 0) {
      await prisma.planLocation.createMany({
        data: locationIds.map((locationId: string) => ({
          planId: plan.id,
          locationId,
          stock: -1, // unlimited
        })),
      })
    }

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "CREATE_PLAN",
        target: plan.id,
        details: JSON.stringify({ name: plan.name, type }),
      },
    })

    return NextResponse.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error("Admin create plan error:", error)
    return NextResponse.json(
      { error: "Ошибка при создании тарифа" },
      { status: 500 }
    )
  }
}
