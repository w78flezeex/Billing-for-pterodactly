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

// GET - Детали пользователя
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        servers: {
          include: {
            plan: true,
            location: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        loginHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Убираем чувствительные данные
    const { password, twoFactorSecret, ...safeUser } = user

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("Admin get user error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении пользователя" },
      { status: 500 }
    )
  }
}

// PATCH - Редактирование пользователя
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

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Разрешенные для изменения поля
    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "role",
      "balance",
      "emailVerified",
      "twoFactorEnabled",
      "isActive",
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Если отключаем 2FA, очищаем связанные данные
    if (updateData.twoFactorEnabled === false) {
      updateData.twoFactorSecret = null
      updateData.twoFactorBackupCodes = []
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "UPDATE_USER",
        target: `user:${id}`,
        details: updateData,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении пользователя" },
      { status: 500 }
    )
  }
}

// DELETE - Удаление пользователя
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

    if (id === check.user.id) {
      return NextResponse.json(
        { error: "Нельзя удалить самого себя" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Мягкое удаление - деактивируем аккаунт
    await prisma.user.update({
      where: { id },
      data: {
        email: `deleted_${id}@deleted.local`,
        isActive: false,
      },
    })

    // Удаляем сессии
    await prisma.session.deleteMany({
      where: { userId: id },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        adminId: check.user.id,
        action: "DELETE_USER",
        target: `user:${id}`,
        details: { originalEmail: user.email },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Пользователь удален",
    })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении пользователя" },
      { status: 500 }
    )
  }
}
