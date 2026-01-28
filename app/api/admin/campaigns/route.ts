import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return null
  }
  return user
}

// GET - Получить все кампании
export async function GET() {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json({ error: "Ошибка получения" }, { status: 500 })
  }
}

// POST - Создать кампанию
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { name, subject, content, targetType, targetFilter, scheduledAt } = await request.json()

    if (!name || !subject || !content || !targetType) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        content,
        targetType,
        targetFilter: targetFilter || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        createdById: admin.id,
      },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 })
  }
}

// PATCH - Обновить кампанию
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id, name, subject, content, targetType, targetFilter, status, scheduledAt } = await request.json()

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Кампания не найдена" }, { status: 404 })
    }

    if (existing.status === "SENT" || existing.status === "SENDING") {
      return NextResponse.json({ error: "Нельзя изменить отправленную кампанию" }, { status: 400 })
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        subject: subject ?? existing.subject,
        content: content ?? existing.content,
        targetType: targetType ?? existing.targetType,
        targetFilter: targetFilter !== undefined ? targetFilter : existing.targetFilter,
        status: status ?? existing.status,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : existing.scheduledAt,
      },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

// DELETE - Удалить кампанию
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id } = await request.json()

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (existing?.status === "SENDING") {
      return NextResponse.json({ error: "Нельзя удалить отправляемую кампанию" }, { status: 400 })
    }

    await prisma.emailCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete campaign error:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
