import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// POST - Подписка на Push-уведомления
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Неверные данные подписки" },
        { status: 400 }
      )
    }

    // Сохраняем подписку в настройках пользователя
    await prisma.setting.upsert({
      where: { key: `push_subscription_${user.id}` },
      create: {
        key: `push_subscription_${user.id}`,
        value: { endpoint, keys, userId: user.id, createdAt: new Date().toISOString() },
      },
      update: {
        value: { endpoint, keys, userId: user.id, updatedAt: new Date().toISOString() },
      },
    })

    console.log(`[Push] User ${user.id} subscribed`)

    return NextResponse.json({ success: true, message: "Подписка активирована" })
  } catch (error) {
    console.error("Push subscribe error:", error)
    return NextResponse.json(
      { error: "Ошибка подписки" },
      { status: 500 }
    )
  }
}

// DELETE - Отписка от Push-уведомлений
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    await prisma.setting.delete({
      where: { key: `push_subscription_${user.id}` },
    }).catch(() => {})

    console.log(`[Push] User ${user.id} unsubscribed`)

    return NextResponse.json({ success: true, message: "Подписка отменена" })
  } catch (error) {
    console.error("Push unsubscribe error:", error)
    return NextResponse.json(
      { error: "Ошибка отписки" },
      { status: 500 }
    )
  }
}
