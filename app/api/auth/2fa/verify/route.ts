import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { verifyTOTP, verifyBackupCode } from "@/lib/totp"
import { createToken, createSession } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// POST - Верификация 2FA при логине
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code, isBackupCode } = body

    if (!userId || !code) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Пользователь не найден или 2FA не включена" },
        { status: 400 }
      )
    }

    let isValid = false
    let updatedBackupCodes = user.twoFactorBackupCodes

    if (isBackupCode) {
      // Проверяем резервный код
      const backupIndex = verifyBackupCode(code, user.twoFactorBackupCodes)
      if (backupIndex !== -1) {
        isValid = true
        // Удаляем использованный резервный код
        updatedBackupCodes = [
          ...user.twoFactorBackupCodes.slice(0, backupIndex),
          ...user.twoFactorBackupCodes.slice(backupIndex + 1),
        ]
        
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: updatedBackupCodes },
        })
      }
    } else {
      // Проверяем TOTP код
      isValid = verifyTOTP(user.twoFactorSecret, code)
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный код" },
        { status: 400 }
      )
    }

    // Создаем токен и сессию
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined

    await createSession(user.id, token, userAgent, ip)

    // Записываем историю входа
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ip || "unknown",
        userAgent,
        success: true,
      },
    })

    // Устанавливаем cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("2FA verify error:", error)
    return NextResponse.json(
      { error: "Ошибка при проверке 2FA" },
      { status: 500 }
    )
  }
}
