import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import {
  generateSecret,
  generateOTPAuthURL,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from "@/lib/totp"

// GET - Получить статус 2FA
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    return NextResponse.json({
      enabled: dbUser?.twoFactorEnabled || false,
      backupCodesCount: dbUser?.twoFactorBackupCodes?.length || 0,
    })
  } catch (error) {
    console.error("Get 2FA status error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении статуса 2FA" },
      { status: 500 }
    )
  }
}

// POST - Начать настройку 2FA
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser?.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA уже включена" },
        { status: 400 }
      )
    }

    // Генерируем секрет
    const secret = generateSecret()
    const otpAuthUrl = generateOTPAuthURL(secret, user.email)

    // Сохраняем секрет временно (не включаем 2FA пока)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
      },
    })

    return NextResponse.json({
      secret,
      otpAuthUrl,
      message: "Отсканируйте QR код и введите код подтверждения",
    })
  } catch (error) {
    console.error("Setup 2FA error:", error)
    return NextResponse.json(
      { error: "Ошибка при настройке 2FA" },
      { status: 500 }
    )
  }
}

// PUT - Подтвердить и включить 2FA
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Введите 6-значный код" },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser?.twoFactorSecret) {
      return NextResponse.json(
        { error: "Сначала начните настройку 2FA" },
        { status: 400 }
      )
    }

    if (dbUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA уже включена" },
        { status: 400 }
      )
    }

    // Проверяем код
    if (!verifyTOTP(dbUser.twoFactorSecret, code)) {
      return NextResponse.json(
        { error: "Неверный код" },
        { status: 400 }
      )
    }

    // Генерируем резервные коды
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = backupCodes.map(hashBackupCode)

    // Включаем 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    return NextResponse.json({
      success: true,
      backupCodes,
      message: "2FA успешно включена. Сохраните резервные коды!",
    })
  } catch (error) {
    console.error("Enable 2FA error:", error)
    return NextResponse.json(
      { error: "Ошибка при включении 2FA" },
      { status: 500 }
    )
  }
}

// DELETE - Отключить 2FA
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: "Введите код для подтверждения" },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA не включена" },
        { status: 400 }
      )
    }

    // Проверяем код (может быть TOTP или резервный код)
    let isValid = verifyTOTP(dbUser.twoFactorSecret, code)

    if (!isValid && dbUser.twoFactorBackupCodes.length > 0) {
      const backupIndex = verifyBackupCode(code, dbUser.twoFactorBackupCodes)
      if (backupIndex !== -1) {
        isValid = true
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный код" },
        { status: 400 }
      )
    }

    // Отключаем 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    return NextResponse.json({
      success: true,
      message: "2FA отключена",
    })
  } catch (error) {
    console.error("Disable 2FA error:", error)
    return NextResponse.json(
      { error: "Ошибка при отключении 2FA" },
      { status: 500 }
    )
  }
}
