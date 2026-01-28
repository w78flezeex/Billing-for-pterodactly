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

// POST - Обновить порядок сортировки
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { orders } = body // Array of { id: string, sortOrder: number }

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: "Необходимо передать массив orders" },
        { status: 400 }
      )
    }

    // Обновляем порядок сортировки для всех тарифов
    await Promise.all(
      orders.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
        prisma.plan.update({
          where: { id },
          data: { sortOrder },
        })
      )
    )

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "REORDER_PLANS",
        target: "plans",
        details: JSON.stringify({ count: orders.length }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder plans error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении порядка" },
      { status: 500 }
    )
  }
}
