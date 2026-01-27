import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить тикет с сообщениями
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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Get ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тикета" },
      { status: 500 }
    )
  }
}

// POST - Добавить сообщение в тикет
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
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Введите сообщение" }, { status: 400 })
    }

    // Проверяем, что тикет принадлежит пользователю
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 })
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "Тикет закрыт" }, { status: 400 })
    }

    // Добавляем сообщение и обновляем статус
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: message,
        isStaff: false,
      },
    })

    await prisma.ticket.update({
      where: { id },
      data: {
        status: "WAITING",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error("Add ticket message error:", error)
    return NextResponse.json(
      { error: "Ошибка при отправке сообщения" },
      { status: 500 }
    )
  }
}

// PATCH - Закрыть тикет
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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 })
    }

    await prisma.ticket.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Тикет закрыт",
    })
  } catch (error) {
    console.error("Close ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при закрытии тикета" },
      { status: 500 }
    )
  }
}
