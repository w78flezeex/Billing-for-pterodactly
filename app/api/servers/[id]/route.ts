import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { pterodactyl } from "@/lib/pterodactyl"

// GET - Получить информацию о сервере
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params

    const server = await prisma.server.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        plan: true,
        location: true,
        backups: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    // Получаем статус сервера из Pterodactyl
    let pterodactylStatus = null
    if (server.pterodactylServerId && process.env.PTERODACTYL_URL && process.env.PTERODACTYL_API_KEY) {
      try {
        pterodactylStatus = await pterodactyl.getServer(server.pterodactylServerId)
      } catch (e) {
        console.error("Pterodactyl error:", e)
      }
    }

    return NextResponse.json({
      server,
      pterodactylStatus,
    })
  } catch (error) {
    console.error("Get server error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении информации о сервере" },
      { status: 500 }
    )
  }
}

// POST - Управление сервером (start, stop, restart, kill)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!["start", "stop", "restart", "kill"].includes(action)) {
      return NextResponse.json(
        { error: "Неверное действие" },
        { status: 400 }
      )
    }

    const server = await prisma.server.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    if (!server.pterodactylServerId) {
      return NextResponse.json(
        { error: "Сервер еще не создан в панели" },
        { status: 400 }
      )
    }

    if (!process.env.PTERODACTYL_URL || !process.env.PTERODACTYL_API_KEY) {
      return NextResponse.json(
        { error: "Pterodactyl не настроен" },
        { status: 500 }
      )
    }

    await pterodactyl.sendPowerAction(String(server.pterodactylServerId), action)

    return NextResponse.json({
      success: true,
      message: `Команда ${action} отправлена`,
    })
  } catch (error) {
    console.error("Server action error:", error)
    return NextResponse.json(
      { error: "Ошибка при управлении сервером" },
      { status: 500 }
    )
  }
}

// PATCH - Продлить сервер
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { months = 1 } = body

    const server = await prisma.server.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        plan: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    const totalPrice = server.plan.price * months

    // Проверяем баланс
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser || currentUser.balance < totalPrice) {
      return NextResponse.json(
        { error: "Недостаточно средств на балансе" },
        { status: 400 }
      )
    }

    // Списываем средства
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: totalPrice } },
    })

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: -totalPrice,
        type: "PURCHASE",
        status: "COMPLETED",
        balanceBefore: currentUser.balance,
        balanceAfter: currentUser.balance - totalPrice,
        description: `Продление сервера ${server.name} на ${months} мес.`,
      },
    })

    // Продлеваем сервер
    const newExpiresAt = new Date(
      server.expiresAt > new Date()
        ? server.expiresAt.getTime() + months * 30 * 24 * 60 * 60 * 1000
        : Date.now() + months * 30 * 24 * 60 * 60 * 1000
    )

    await prisma.server.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({
      success: true,
      message: `Сервер продлен до ${newExpiresAt.toLocaleDateString("ru-RU")}`,
      expiresAt: newExpiresAt,
    })
  } catch (error) {
    console.error("Renew server error:", error)
    return NextResponse.json(
      { error: "Ошибка при продлении сервера" },
      { status: 500 }
    )
  }
}

// DELETE - Удалить сервер
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params

    const server = await prisma.server.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    // Удаляем сервер из Pterodactyl
    if (server.pterodactylServerId && process.env.PTERODACTYL_URL && process.env.PTERODACTYL_API_KEY) {
      try {
        await pterodactyl.deleteServer(server.pterodactylServerId)
      } catch (e) {
        console.error("Pterodactyl delete error:", e)
      }
    }

    // Помечаем сервер как удаленный
    await prisma.server.update({
      where: { id },
      data: { status: "TERMINATED" },
    })

    return NextResponse.json({
      success: true,
      message: "Сервер удален",
    })
  } catch (error) {
    console.error("Delete server error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении сервера" },
      { status: 500 }
    )
  }
}
