import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить серверы пользователя
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const servers = await prisma.server.findMany({
      where: { userId: user.id },
      include: {
        plan: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Get servers error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении серверов" },
      { status: 500 }
    )
  }
}

// POST - Заказать сервер
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, locationId, hostname, promocode } = body

    if (!planId || !locationId) {
      return NextResponse.json(
        { error: "Выберите тариф и локацию" },
        { status: 400 }
      )
    }

    // Получаем тариф
    const plan = await prisma.plan.findUnique({
      where: { id: planId, isActive: true },
    })

    if (!plan) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 })
    }

    // Проверяем доступность локации
    const planLocation = await prisma.planLocation.findFirst({
      where: {
        planId,
        locationId,
      },
      include: {
        location: true,
      },
    })

    if (!planLocation || planLocation.stock === 0) {
      return NextResponse.json(
        { error: "Локация недоступна для этого тарифа" },
        { status: 400 }
      )
    }

    // Рассчитываем цену с учетом промокода
    let finalPrice = plan.price
    let usedPromocodeId = null

    if (promocode) {
      const promoCheck = await prisma.promocode.findUnique({
        where: { code: promocode.toUpperCase() },
      })

      if (promoCheck && promoCheck.isActive) {
        const now = new Date()
        if (
          (!promoCheck.validUntil || promoCheck.validUntil > now) &&
          (!promoCheck.maxUses || promoCheck.usedCount < promoCheck.maxUses)
        ) {
          if (promoCheck.type === "PERCENT") {
            finalPrice = finalPrice * (1 - promoCheck.value / 100)
          } else if (promoCheck.type === "FIXED") {
            finalPrice = Math.max(0, finalPrice - promoCheck.value)
          }
          usedPromocodeId = promoCheck.id
        }
      }
    }

    // Проверяем баланс
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser || currentUser.balance < finalPrice) {
      return NextResponse.json(
        { error: "Недостаточно средств на балансе" },
        { status: 400 }
      )
    }

    // Списываем средства
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: finalPrice } },
    })

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: -finalPrice,
        type: "PURCHASE",
        status: "COMPLETED",
        balanceBefore: currentUser.balance,
        balanceAfter: currentUser.balance - finalPrice,
        description: `Заказ сервера: ${plan.name}`,
      },
    })

    // Обновляем использование промокода
    if (usedPromocodeId) {
      await prisma.promocode.update({
        where: { id: usedPromocodeId },
        data: { usedCount: { increment: 1 } },
      })

      await prisma.promocodeUsage.create({
        data: {
          promocodeId: usedPromocodeId,
          userId: user.id,
          amount: plan.price - finalPrice,
        },
      })
    }

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        planId,
        amount: finalPrice,
        status: "PROCESSING",
        promocodeId: usedPromocodeId,
      },
    })

    // Получаем specs из плана для создания сервера
    const specs = plan.specs as { cpu?: number; ram?: number; disk?: number } || {}

    // Создаем сервер в БД (пока без pterodactyl ID)
    const server = await prisma.server.create({
      data: {
        userId: user.id,
        planId,
        locationId,
        name: hostname || `server-${Date.now()}`,
        status: "INSTALLING",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      },
    })

    // Обрабатываем реферальный бонус для первой покупки
    if (currentUser.referredById) {
      const previousPurchases = await prisma.transaction.count({
        where: {
          userId: user.id,
          type: "PURCHASE",
          status: "COMPLETED",
        },
      })

      // Если это первая покупка, начисляем бонус рефереру
      if (previousPurchases === 1) {
        const referralBonus = Math.min(
          Math.max(finalPrice * 0.1, 50),
          500
        ) // 10%, мин 50, макс 500
        
        const referrer = await prisma.user.findUnique({
          where: { id: currentUser.referredById },
        })

        if (referrer) {
          await prisma.user.update({
            where: { id: currentUser.referredById },
            data: {
              balance: { increment: referralBonus },
              referralBalance: { increment: referralBonus },
            },
          })

          await prisma.transaction.create({
            data: {
              userId: currentUser.referredById,
              amount: referralBonus,
              type: "REFERRAL",
              status: "COMPLETED",
              balanceBefore: referrer.balance,
              balanceAfter: referrer.balance + referralBonus,
              description: `Реферальный бонус от пользователя ${user.email}`,
            },
          })
        }
      }
    }

    // TODO: Создать сервер в Pterodactyl Panel
    // Это должно выполняться асинхронно или через очередь

    return NextResponse.json({
      success: true,
      order,
      server,
      message: "Сервер успешно заказан и будет создан в течение нескольких минут",
    })
  } catch (error) {
    console.error("Order server error:", error)
    return NextResponse.json(
      { error: "Ошибка при заказе сервера" },
      { status: 500 }
    )
  }
}
