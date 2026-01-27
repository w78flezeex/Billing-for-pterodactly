import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET - Получить статью по slug и увеличить просмотры
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const article = await prisma.faqArticle.findUnique({
      where: { slug },
      include: { category: true },
    })

    if (!article || !article.isPublished) {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 })
    }

    // Увеличиваем просмотры
    await prisma.faqArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error("Get article error:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}
