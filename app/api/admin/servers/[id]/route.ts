import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Get single server
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const server = await prisma.server.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, email: true, name: true, balance: true }
        },
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

    return NextResponse.json({ server })
  } catch (error) {
    console.error("Error fetching server:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// PATCH - Update server
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const body = await request.json()
    const { status, expiresAt, autoRenew, name } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (expiresAt) updateData.expiresAt = new Date(expiresAt)
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew
    if (name) updateData.name = name

    // Handle suspension
    if (status === "SUSPENDED") {
      updateData.suspendedAt = new Date()
    } else if (status === "ACTIVE") {
      updateData.suspendedAt = null
    }

    const server = await prisma.server.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        plan: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, flag: true } },
      },
    })

    return NextResponse.json({ server })
  } catch (error) {
    console.error("Error updating server:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// DELETE - Delete server
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    await prisma.server.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting server:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
