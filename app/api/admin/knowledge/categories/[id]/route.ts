import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: "Не авторизован", status: 401 }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  
  if (dbUser?.role !== "ADMIN") return { error: "Нет доступа", status: 403 }
  return { user }
}

// PUT - Обновить категорию
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params
    const { name, slug, icon, sortOrder } = await request.json()

    // Проверяем уникальность slug
    if (slug) {
      const existing = await prisma.faqCategory.findFirst({
        where: { slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: "Такой slug уже существует" }, { status: 400 })
      }
    }

    const category = await prisma.faqCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

// DELETE - Удалить категорию
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params

    await prisma.faqCategory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
