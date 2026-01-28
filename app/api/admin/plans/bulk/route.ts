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

type BulkAction = 
  | "activate" 
  | "deactivate" 
  | "delete" 
  | "set_popular" 
  | "unset_popular"
  | "increase_price"
  | "decrease_price"

// POST - Массовые операции
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { planIds, action, value } = body as {
      planIds: string[]
      action: BulkAction
      value?: number // для изменения цены (процент)
    }

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Выберите хотя бы один тариф" },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: "Укажите действие" },
        { status: 400 }
      )
    }

    let updatedCount = 0
    let errors: string[] = []

    switch (action) {
      case "activate":
        const activateResult = await prisma.plan.updateMany({
          where: { id: { in: planIds } },
          data: { isActive: true },
        })
        updatedCount = activateResult.count
        break

      case "deactivate":
        const deactivateResult = await prisma.plan.updateMany({
          where: { id: { in: planIds } },
          data: { isActive: false },
        })
        updatedCount = deactivateResult.count
        break

      case "set_popular":
        const popularResult = await prisma.plan.updateMany({
          where: { id: { in: planIds } },
          data: { isPopular: true },
        })
        updatedCount = popularResult.count
        break

      case "unset_popular":
        const unpopularResult = await prisma.plan.updateMany({
          where: { id: { in: planIds } },
          data: { isPopular: false },
        })
        updatedCount = unpopularResult.count
        break

      case "delete":
        // Проверяем что нет активных серверов
        const plansWithServers = await prisma.plan.findMany({
          where: { 
            id: { in: planIds },
          },
          include: {
            _count: {
              select: { servers: true },
            },
          },
        })

        const plansToDelete: string[] = []
        
        for (const plan of plansWithServers) {
          if (plan._count.servers > 0) {
            errors.push(`Тариф "${plan.name}" имеет ${plan._count.servers} активных серверов`)
          } else {
            plansToDelete.push(plan.id)
          }
        }

        if (plansToDelete.length > 0) {
          // Удаляем связи с локациями
          await prisma.planLocation.deleteMany({
            where: { planId: { in: plansToDelete } },
          })
          
          // Удаляем тарифы
          const deleteResult = await prisma.plan.deleteMany({
            where: { id: { in: plansToDelete } },
          })
          updatedCount = deleteResult.count
        }
        break

      case "increase_price":
      case "decrease_price":
        const percent = value || 10
        const multiplier = action === "increase_price" 
          ? (1 + percent / 100) 
          : (1 - percent / 100)

        const plans = await prisma.plan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, price: true, priceYearly: true },
        })

        for (const plan of plans) {
          await prisma.plan.update({
            where: { id: plan.id },
            data: {
              price: Math.round(plan.price * multiplier * 100) / 100,
              priceYearly: plan.priceYearly 
                ? Math.round(plan.priceYearly * multiplier * 100) / 100 
                : null,
            },
          })
          updatedCount++
        }
        break

      default:
        return NextResponse.json(
          { error: "Неизвестное действие" },
          { status: 400 }
        )
    }

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: `BULK_${action.toUpperCase()}`,
        target: "plans",
        details: JSON.stringify({ 
          planIds,
          action,
          value,
          updatedCount,
          errors,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      updatedCount,
      errors,
    })
  } catch (error) {
    console.error("Bulk plans action error:", error)
    return NextResponse.json(
      { error: "Ошибка при выполнении массовой операции" },
      { status: 500 }
    )
  }
}
