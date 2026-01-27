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

// GET - Получить тариф
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
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

    if (!plan) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Get plan error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тарифа" },
      { status: 500 }
    )
  }
}

// PATCH - Обновить тариф
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Проверяем что тариф существует
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 })
    }

    // Validate type if provided
    if (type && !Object.values(PlanType).includes(type)) {
      return NextResponse.json(
        { error: "Неверный тип тарифа" },
        { status: 400 }
      )
    }

    // Обновляем тариф
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type: type as PlanType }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceYearly !== undefined && { priceYearly: priceYearly ? parseFloat(priceYearly) : null }),
        ...(features !== undefined && { features }),
        ...(specs !== undefined && { specs }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(pterodactylNestId !== undefined && { 
          pterodactylNestId: pterodactylNestId ? parseInt(pterodactylNestId) : null 
        }),
        ...(pterodactylEggId !== undefined && { 
          pterodactylEggId: pterodactylEggId ? parseInt(pterodactylEggId) : null 
        }),
      },
    })

    // Обновляем локации если указаны
    if (locationIds !== undefined) {
      // Удаляем старые
      await prisma.planLocation.deleteMany({
        where: { planId: params.id },
      })
      
      // Добавляем новые
      if (locationIds.length > 0) {
        await prisma.planLocation.createMany({
          data: locationIds.map((locationId: string) => ({
            planId: params.id,
            locationId,
            stock: -1,
          })),
        })
      }
    }

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "UPDATE_PLAN",
        target: plan.id,
        details: JSON.stringify({ name: plan.name, changes: Object.keys(body) }),
      },
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("Update plan error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении тарифа" },
      { status: 500 }
    )
  }
}

// DELETE - Удалить тариф
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    // Проверяем что тариф существует и нет активных серверов
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { servers: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 })
    }

    if (plan._count.servers > 0) {
      return NextResponse.json(
        { error: `Нельзя удалить тариф - есть активные серверы (${plan._count.servers})` },
        { status: 400 }
      )
    }

    // Удаляем локации тарифа
    await prisma.planLocation.deleteMany({
      where: { planId: params.id },
    })

    // Удаляем тариф
    await prisma.plan.delete({
      where: { id: params.id },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "DELETE_PLAN",
        target: params.id,
        details: JSON.stringify({ name: plan.name }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete plan error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении тарифа" },
      { status: 500 }
    )
  }
}
