import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить автопродления пользователя
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const autoRenewals = await prisma.autoRenewal.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ autoRenewals })
  } catch (error) {
    console.error("Get auto renewals error:", error)
    return NextResponse.json({ error: "Ошибка получения" }, { status: 500 })
  }
}

// POST - Создать/обновить автопродление
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { serverId, isEnabled, daysBeforeExpiry, renewalPeriod } = await request.json()

    if (!serverId) {
      return NextResponse.json({ error: "Укажите сервер" }, { status: 400 })
    }

    // Проверяем, что сервер принадлежит пользователю
    const server = await prisma.server.findFirst({
      where: { id: serverId, userId: user.id },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    const autoRenewal = await prisma.autoRenewal.upsert({
      where: {
        userId_serverId: {
          userId: user.id,
          serverId,
        },
      },
      update: {
        isEnabled: isEnabled ?? true,
        daysBeforeExpiry: daysBeforeExpiry || 3,
        renewalPeriod: renewalPeriod || 30,
      },
      create: {
        userId: user.id,
        serverId,
        isEnabled: isEnabled ?? true,
        daysBeforeExpiry: daysBeforeExpiry || 3,
        renewalPeriod: renewalPeriod || 30,
      },
    })

    return NextResponse.json({ success: true, autoRenewal })
  } catch (error) {
    console.error("Save auto renewal error:", error)
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 })
  }
}

// DELETE - Удалить автопродление
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { serverId } = await request.json()

    await prisma.autoRenewal.delete({
      where: {
        userId_serverId: {
          userId: user.id,
          serverId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete auto renewal error:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
