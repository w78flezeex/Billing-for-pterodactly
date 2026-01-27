import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// POST - Запрос на восстановление пароля
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Введите email" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Всегда возвращаем успех для безопасности
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Если аккаунт существует, письмо с инструкциями отправлено",
      })
    }

    // Генерируем токен
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Сохраняем токен (действителен 1 час)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // TODO: Отправить email с ссылкой для сброса
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    // await sendEmail(user.email, "Восстановление пароля", resetUrl)

    console.log(`Reset token for ${email}: ${resetToken}`)

    return NextResponse.json({
      success: true,
      message: "Если аккаунт существует, письмо с инструкциями отправлено",
      // В dev режиме можно вернуть токен
      ...(process.env.NODE_ENV === "development" && { token: resetToken }),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Ошибка при запросе восстановления" },
      { status: 500 }
    )
  }
}
