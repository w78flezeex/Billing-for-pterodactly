import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// POST - Отписка по endpoint
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint не указан" },
        { status: 400 }
      )
    }

    // Удаляем подписку
    await prisma.setting.delete({
      where: { key: `push_subscription_${user.id}` },
    }).catch(() => {})

    console.log(`[Push] User ${user.id} unsubscribed via endpoint`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push unsubscribe error:", error)
    return NextResponse.json(
      { error: "Ошибка отписки" },
      { status: 500 }
    )
  }
}
