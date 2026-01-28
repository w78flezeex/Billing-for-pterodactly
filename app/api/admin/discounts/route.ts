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

// GET - Получить все уровни скидок
export async function GET() {
  try {
    const discounts = await prisma.volumeDiscount.findMany({
      orderBy: { minAmount: "asc" },
    })

    return NextResponse.json({ discounts })
  } catch (error) {
    console.error("Get discounts error:", error)
    return NextResponse.json({ error: "Ошибка получения скидок" }, { status: 500 })
  }
}

// POST - Создать/обновить уровень скидки (только админ)
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id, name, minAmount, discountPercent, isActive } = await request.json()

    if (!name || minAmount === undefined || discountPercent === undefined) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
    }

    if (discountPercent < 0 || discountPercent > 50) {
      return NextResponse.json({ error: "Скидка должна быть от 0 до 50%" }, { status: 400 })
    }

    let discount
    if (id) {
      discount = await prisma.volumeDiscount.update({
        where: { id },
        data: { name, minAmount, discountPercent, isActive },
      })
    } else {
      discount = await prisma.volumeDiscount.create({
        data: { name, minAmount, discountPercent, isActive: isActive ?? true },
      })
    }

    return NextResponse.json({ success: true, discount })
  } catch (error) {
    console.error("Save discount error:", error)
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 })
  }
}

// DELETE - Удалить уровень скидки
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id } = await request.json()

    await prisma.volumeDiscount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete discount error:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
