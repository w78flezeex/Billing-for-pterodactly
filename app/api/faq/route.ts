import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET - Получить FAQ статьи
export async function GET() {
  try {
    const categories = await prisma.faqCategory.findMany({
      include: {
        articles: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Get FAQ error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении FAQ" },
      { status: 500 }
    )
  }
}
