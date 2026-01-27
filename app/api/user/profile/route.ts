import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth"
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/auth"
import prisma from "@/lib/db"

// GET - получить профиль
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      )
    }

    // Получаем дополнительные данные: серверы, заказы
    const [servers, orders] = await Promise.all([
      prisma.server.findMany({
        where: { userId: user.id },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.findMany({
        where: { userId: user.id },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    return NextResponse.json({
      user,
      servers,
      orders,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении профиля" },
      { status: 500 }
    )
  }
}

// PATCH - обновить профиль
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Проверяем тип обновления
    if (body.type === "password") {
      // Смена пароля
      const result = changePasswordSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 }
        )
      }

      // Получаем текущий пароль пользователя
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!dbUser) {
        return NextResponse.json(
          { error: "Пользователь не найден" },
          { status: 404 }
        )
      }

      // Проверяем текущий пароль
      const isValid = await verifyPassword(result.data.currentPassword, dbUser.password)
      if (!isValid) {
        return NextResponse.json(
          { error: "Неверный текущий пароль" },
          { status: 400 }
        )
      }

      // Хешируем новый пароль
      const hashedPassword = await hashPassword(result.data.newPassword)

      // Обновляем пароль
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      return NextResponse.json({ message: "Пароль успешно изменен" })
    } else {
      // Обновление профиля
      const result = updateProfileSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 }
        )
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: result.data.name,
          phone: result.data.phone || null,
          company: result.data.company || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          company: true,
          avatar: true,
          role: true,
          balance: true,
        },
      })

      return NextResponse.json({
        message: "Профиль обновлен",
        user: updatedUser,
      })
    }
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении профиля" },
      { status: 500 }
    )
  }
}
