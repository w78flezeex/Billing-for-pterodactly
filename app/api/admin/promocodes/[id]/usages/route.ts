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
    select: { role: true, id: true },
  })
  
  if (dbUser?.role !== "ADMIN") {
    return { error: "Нет доступа", status: 403 }
  }
  
  return { user: dbUser }
}

// GET - Получить использования промокода
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

    const promocode = await prisma.promocode.findUnique({
      where: { id },
    })

    if (!promocode) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 })
    }

    const usages = await prisma.promocodeUsage.findMany({
      where: { promocodeId: id },
      include: {
        user: {
          select: { 
            id: true,
            email: true, 
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ usages })
  } catch (error) {
    console.error("Admin get promocode usages error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении использований" },
      { status: 500 }
    )
  }
}
