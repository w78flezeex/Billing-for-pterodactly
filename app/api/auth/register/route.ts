import { NextRequest, NextResponse } from "next/server"
import { registerSchema } from "@/lib/validations/auth"
import { hashPassword, createToken, createSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { checkRateLimit, getClientIP, isValidEmail, hasSQLInjection, sanitizeString, RATE_LIMITS, logSecurityEvent } from "@/lib/security"

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  // Rate limiting - защита от брутфорса регистрации
  const rateCheck = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth)
  if (!rateCheck.allowed) {
    await logSecurityEvent({
      type: "RATE_LIMIT",
      ip,
      path: "/api/auth/register",
    })
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // Проверка на SQL injection
    const inputString = JSON.stringify(body)
    if (hasSQLInjection(inputString)) {
      await logSecurityEvent({
        type: "SQL_INJECTION",
        ip,
        path: "/api/auth/register",
        details: "Suspicious input detected",
      })
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    // Валидация
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    // Дополнительная проверка email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Некорректный email" },
        { status: 400 }
      )
    }

    // Санитизация имени
    const sanitizedName = sanitizeString(name)

    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      )
    }

    // Хеширование пароля
    const hashedPassword = await hashPassword(password)

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: sanitizedName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Создание токена
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Создание сессии
    const userAgent = request.headers.get("user-agent") || undefined
    await createSession(user.id, token, userAgent, ip)

    // Установка cookie
    const response = NextResponse.json({
      message: "Регистрация успешна",
      user,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",  // Строже защита от CSRF
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    )
  }
}
