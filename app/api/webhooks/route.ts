import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import crypto from "crypto"

// GET - Получить webhooks пользователя
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: user.id },
      include: {
        logs: {
          take: 5,
          orderBy: { executedAt: "desc" },
        },
      },
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("Get webhooks error:", error)
    return NextResponse.json({ error: "Ошибка получения" }, { status: 500 })
  }
}

// POST - Создать webhook
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { name, url, events } = await request.json()

    if (!name || !url || !events?.length) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
    }

    // Валидация URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Неверный URL" }, { status: 400 })
    }

    // Проверяем лимит webhooks
    const count = await prisma.webhook.count({
      where: { userId: user.id },
    })

    if (count >= 10) {
      return NextResponse.json({ error: "Максимум 10 webhooks" }, { status: 400 })
    }

    // Генерируем секрет для подписи
    const secret = crypto.randomBytes(32).toString("hex")

    const webhook = await prisma.webhook.create({
      data: {
        userId: user.id,
        name,
        url,
        events,
        secret,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, webhook })
  } catch (error) {
    console.error("Create webhook error:", error)
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 })
  }
}

// PATCH - Обновить webhook
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id, name, url, events, isActive } = await request.json()

    // Проверяем владельца
    const existing = await prisma.webhook.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Webhook не найден" }, { status: 404 })
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        url: url ?? existing.url,
        events: events ?? existing.events,
        isActive: isActive ?? existing.isActive,
      },
    })

    return NextResponse.json({ success: true, webhook })
  } catch (error) {
    console.error("Update webhook error:", error)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

// DELETE - Удалить webhook
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await request.json()

    // Проверяем владельца
    const existing = await prisma.webhook.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Webhook не найден" }, { status: 404 })
    }

    await prisma.webhook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete webhook error:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
