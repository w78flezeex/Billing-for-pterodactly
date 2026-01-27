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

// GET - Список статей
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const articles = await prisma.faqArticle.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
      },
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

// POST - Создать статью
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { title, slug, content, categoryId, isPublished } = await request.json()

    if (!title || !slug || !content || !categoryId) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
    }

    // Проверяем уникальность slug
    const existing = await prisma.faqArticle.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Такой slug уже существует" }, { status: 400 })
    }

    // Проверяем категорию
    const category = await prisma.faqCategory.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 400 })
    }

    const article = await prisma.faqArticle.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        isPublished: isPublished ?? true,
      },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 })
  }
}
