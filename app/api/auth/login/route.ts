import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/lib/validations/auth"
import { verifyPassword, createToken, createSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { checkRateLimit, getClientIP, hasSQLInjection, RATE_LIMITS, logSecurityEvent } from "@/lib/security"

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  // Rate limiting - защита от брутфорса
  const rateCheck = checkRateLimit(`login:${ip}`, RATE_LIMITS.auth)
  if (!rateCheck.allowed) {
    await logSecurityEvent({
      type: "BRUTE_FORCE",
      ip,
      path: "/api/auth/login",
    })
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // Проверка на SQL injection
    if (hasSQLInjection(JSON.stringify(body))) {
      await logSecurityEvent({
        type: "SQL_INJECTION",
        ip,
        path: "/api/auth/login",
      })
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    // Валидация
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Поиск пользователя (нормализуем email)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      // Одинаковое сообщение для защиты от энумерации пользователей
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      )
    }

    // Проверка активности
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Аккаунт заблокирован" },
        { status: 403 }
      )
    }

    // Проверка пароля
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      // Записываем неудачную попытку
      const userAgent = request.headers.get("user-agent") || undefined
      
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: ip || "unknown",
          userAgent,
          success: false,
        },
      })
      
      await logSecurityEvent({
        type: "BRUTE_FORCE",
        ip,
        userId: user.id,
        path: "/api/auth/login",
        details: "Failed password attempt",
      })
      
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      )
    }

    // Проверка 2FA
    if (user.twoFactorEnabled) {
      // Возвращаем флаг для перехода на страницу ввода 2FA кода
      return NextResponse.json({
        requires2FA: true,
        userId: user.id,
        message: "Требуется двухфакторная аутентификация",
      })
    }

    // Обновление lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Записываем успешный вход
    const userAgent = request.headers.get("user-agent") || undefined
    
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ip || "unknown",
        userAgent,
        success: true,
      },
    })

    // Создание токена
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Создание сессии
    await createSession(user.id, token, userAgent, ip)

    // Установка cookie
    const response = NextResponse.json({
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        balance: user.balance,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Ошибка при входе" },
      { status: 500 }
    )
  }
}
