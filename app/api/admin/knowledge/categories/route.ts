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

// GET - Список категорий
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const categories = await prisma.faqCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { articles: true } },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

// POST - Создать категорию
export async function POST(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { name, slug, icon } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: "Укажите название и slug" }, { status: 400 })
    }

    // Проверяем уникальность slug
    const existing = await prisma.faqCategory.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Такой slug уже существует" }, { status: 400 })
    }

    const category = await prisma.faqCategory.create({
      data: {
        name,
        slug,
        icon,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 })
  }
}
