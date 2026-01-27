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

// GET - Получить статью
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

    const article = await prisma.faqArticle.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!article) {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error("Error fetching article:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

// PUT - Обновить статью
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
    const { title, slug, content, categoryId, isPublished, sortOrder } = await request.json()

    // Проверяем уникальность slug
    if (slug) {
      const existing = await prisma.faqArticle.findFirst({
        where: { slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: "Такой slug уже существует" }, { status: 400 })
      }
    }

    const article = await prisma.faqArticle.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content && { content }),
        ...(categoryId && { categoryId }),
        ...(isPublished !== undefined && { isPublished }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error("Error updating article:", error)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

// DELETE - Удалить статью
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

    await prisma.faqArticle.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting article:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
