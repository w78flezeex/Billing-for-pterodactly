import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// Проверка админ-прав
async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Не авторизован", status: 401 }
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, id: true, name: true },
  })
  
  if (dbUser?.role !== "ADMIN") {
    return { error: "Нет доступа", status: 403 }
  }
  
  return { user: dbUser }
}

// GET - Получить тикет с сообщениями (для админа)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
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
    console.error("Admin get ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тикета" },
      { status: 500 }
    )
  }
}

// POST - Ответить на тикет (от имени админа)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Введите сообщение" }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 })
    }

    // Добавляем сообщение от админа
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: message,
        isStaff: true,
      },
    })

    // Обновляем статус тикета
    await prisma.ticket.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    })

    // Создаем уведомление для пользователя
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "TICKET",
        title: "Ответ на тикет",
        message: `Получен ответ на тикет: ${ticket.subject}`,
        link: `/tickets/${id}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error("Admin reply ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при отправке ответа" },
      { status: 500 }
    )
  }
}

// PATCH - Изменить статус/приоритет тикета
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params
    const body = await request.json()

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.status) {
      updateData.status = body.status
      if (body.status === "CLOSED") {
        updateData.closedAt = new Date()
      }
    }
    
    if (body.priority) {
      updateData.priority = body.priority
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    })
  } catch (error) {
    console.error("Admin update ticket error:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении тикета" },
      { status: 500 }
    )
  }
}
