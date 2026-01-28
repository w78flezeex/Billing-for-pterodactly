import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить скидку текущего пользователя
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Получаем информацию о скидке пользователя
    let userDiscount = await prisma.userDiscount.findUnique({
      where: { userId: user.id },
    })

    // Получаем все уровни скидок
    const volumeDiscounts = await prisma.volumeDiscount.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" },
    })

    // Если нет записи - создаём
    if (!userDiscount) {
      // Подсчитываем общую сумму успешных платежей
      const totalSpent = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: "DEPOSIT",
          status: "COMPLETED",
        },
        _sum: { amount: true },
      })

      const spent = totalSpent._sum.amount || 0

      // Определяем уровень скидки
      const applicableDiscount = volumeDiscounts
        .filter(d => spent >= d.minAmount)
        .sort((a, b) => b.minAmount - a.minAmount)[0]

      userDiscount = await prisma.userDiscount.create({
        data: {
          userId: user.id,
          totalSpent: spent,
          discountPercent: applicableDiscount?.discountPercent || 0,
          discountTier: applicableDiscount?.name || null,
        },
      })
    }

    // Находим следующий уровень
    const currentTierIndex = volumeDiscounts.findIndex(
      d => d.name === userDiscount?.discountTier
    )
    const nextTier = volumeDiscounts[currentTierIndex + 1] || null

    return NextResponse.json({
      discount: userDiscount,
      tiers: volumeDiscounts,
      nextTier: nextTier ? {
        name: nextTier.name,
        minAmount: nextTier.minAmount,
        discountPercent: nextTier.discountPercent,
        remaining: nextTier.minAmount - (userDiscount?.totalSpent || 0),
      } : null,
    })
  } catch (error) {
    console.error("Get user discount error:", error)
    return NextResponse.json({ error: "Ошибка получения скидки" }, { status: 500 })
  }
}
