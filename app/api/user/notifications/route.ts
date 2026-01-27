import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// PATCH - Обновить настройки уведомлений
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { notifyEmail, notifyTelegram, telegramChatId, discordWebhook } = body

    const updateData: Record<string, unknown> = {}

    if (typeof notifyEmail === "boolean") {
      updateData.notifyEmail = notifyEmail
    }

    if (typeof notifyTelegram === "boolean") {
      updateData.notifyTelegram = notifyTelegram
    }

    if (telegramChatId !== undefined) {
      updateData.telegramChatId = telegramChatId || null
    }

    if (discordWebhook !== undefined) {
      updateData.discordWebhook = discordWebhook || null
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        notifyEmail: true,
        notifyTelegram: true,
        telegramChatId: true,
        discordWebhook: true,
      },
    })

    return NextResponse.json({
      success: true,
      settings: updatedUser,
    })
  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении настроек" },
      { status: 500 }
    )
  }
}

// GET - Получить настройки уведомлений
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notifyEmail: true,
        notifyTelegram: true,
        telegramChatId: true,
        discordWebhook: true,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении настроек" },
      { status: 500 }
    )
  }
}
