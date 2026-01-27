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

// GET - Получить промокод
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params

    const promocode = await prisma.promocode.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!promocode) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 })
    }

    return NextResponse.json({ promocode })
  } catch (error) {
    console.error("Admin get promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении промокода" },
      { status: 500 }
    )
  }
}

// PATCH - Обновить промокод
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params
    const body = await request.json()

    const promocode = await prisma.promocode.findUnique({
      where: { id },
    })

    if (!promocode) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 })
    }

    const allowedFields = ["isActive", "maxUses", "maxUsesPerUser", "expiresAt", "minAmount", "applicablePlanIds"]
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "expiresAt" && body[field]) {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updated = await prisma.promocode.update({
      where: { id },
      data: updateData,
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "UPDATE_PROMOCODE",
        target: id,
        details: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({
      success: true,
      promocode: updated,
    })
  } catch (error) {
    console.error("Admin update promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении промокода" },
      { status: 500 }
    )
  }
}

// DELETE - Удалить промокод
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params

    const promocode = await prisma.promocode.findUnique({
      where: { id },
    })

    if (!promocode) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 })
    }

    await prisma.promocode.delete({
      where: { id },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "DELETE_PROMOCODE",
        target: id,
        details: JSON.stringify({ code: promocode.code }),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Промокод удален",
    })
  } catch (error) {
    console.error("Admin delete promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении промокода" },
      { status: 500 }
    )
  }
}
