import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить список тикетов
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тикетов" },
      { status: 500 }
    )
  }
}

// POST - Создать тикет
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { subject, message, priority, category, serverId } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Заполните тему и сообщение" },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject,
        priority: priority || "NORMAL",
        category,
        serverId,
        messages: {
          create: {
            content: message,
            isStaff: false,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при создании тикета" },
      { status: 500 }
    )
  }
}
