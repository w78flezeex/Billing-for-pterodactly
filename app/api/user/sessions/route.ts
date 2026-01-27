import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { cookies } from "next/headers"

// GET - Получить активные сессии
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const currentToken = cookieStore.get("auth-token")?.value

    const sessions = await prisma.session.findMany({
      where: { 
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    // Помечаем текущую сессию
    const sessionsWithCurrent = sessions.map(session => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken,
    }))

    // Получаем историю входов
    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      sessions: sessionsWithCurrent,
      loginHistory,
    })
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении сессий" },
      { status: 500 }
    )
  }
}

// DELETE - Завершить сессию
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { sessionId, all } = await request.json()

    const cookieStore = await cookies()
    const currentToken = cookieStore.get("auth-token")?.value

    if (all) {
      // Завершить все сессии кроме текущей
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: currentToken },
        },
      })
    } else if (sessionId) {
      // Завершить конкретную сессию
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: user.id },
      })

      if (!session) {
        return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 })
      }

      if (session.token === currentToken) {
        return NextResponse.json(
          { error: "Нельзя завершить текущую сессию" },
          { status: 400 }
        )
      }

      await prisma.session.delete({ where: { id: sessionId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete session error:", error)
    return NextResponse.json(
      { error: "Ошибка при завершении сессии" },
      { status: 500 }
    )
  }
}
