import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить список подарков (отправленные и полученные)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const [sent, received] = await Promise.all([
      prisma.balanceGift.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.balanceGift.findMany({
        where: { recipientId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ sent, received })
  } catch (error) {
    console.error("Get gifts error:", error)
    return NextResponse.json({ error: "Ошибка получения подарков" }, { status: 500 })
  }
}

// POST - Отправить подарок
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { recipientEmail, amount, message } = await request.json()

    if (!recipientEmail || !amount) {
      return NextResponse.json({ error: "Укажите email получателя и сумму" }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: "Минимальная сумма подарка — 10₽" }, { status: 400 })
    }

    if (amount > 100000) {
      return NextResponse.json({ error: "Максимальная сумма подарка — 100,000₽" }, { status: 400 })
    }

    // Проверяем баланс отправителя
    const sender = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    })

    if (!sender || sender.balance < amount) {
      return NextResponse.json({ error: "Недостаточно средств" }, { status: 400 })
    }

    // Нельзя отправлять самому себе
    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: "Нельзя отправить подарок себе" }, { status: 400 })
    }

    // Ищем получателя
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail.toLowerCase() },
    })

    // Создаём подарок и списываем средства в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Списываем у отправителя
      const updatedSender = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      })

      // Создаём запись о подарке
      const gift = await tx.balanceGift.create({
        data: {
          senderId: user.id,
          recipientId: recipient?.id || null,
          recipientEmail: recipientEmail.toLowerCase(),
          amount,
          message: message?.slice(0, 500) || null,
          status: recipient ? "PENDING" : "PENDING",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        },
      })

      // Записываем транзакцию
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "PURCHASE",
          amount: -amount,
          balanceBefore: sender!.balance,
          balanceAfter: updatedSender.balance,
          description: `Подарок для ${recipientEmail}`,
          status: "COMPLETED",
        },
      })

      // Если получатель найден, сразу зачисляем
      if (recipient) {
        const updatedRecipient = await tx.user.update({
          where: { id: recipient.id },
          data: { balance: { increment: amount } },
        })

        await tx.balanceGift.update({
          where: { id: gift.id },
          data: { status: "CLAIMED", claimedAt: new Date() },
        })

        await tx.transaction.create({
          data: {
            userId: recipient.id,
            type: "BONUS",
            amount: amount,
            balanceBefore: recipient.balance,
            balanceAfter: updatedRecipient.balance,
            description: `Подарок от ${user.name || user.email}`,
            status: "COMPLETED",
          },
        })

        // Создаём уведомление получателю
        await tx.notification.create({
          data: {
            userId: recipient.id,
            type: "PAYMENT",
            title: "Вы получили подарок!",
            message: `${user.name || "Пользователь"} отправил вам ${amount}₽${message ? `. Сообщение: ${message}` : ""}`,
          },
        })
      }

      return gift
    })

    return NextResponse.json({
      success: true,
      gift: result,
      recipientFound: !!recipient,
    })
  } catch (error) {
    console.error("Send gift error:", error)
    return NextResponse.json({ error: "Ошибка отправки подарка" }, { status: 500 })
  }
}

// DELETE - Отменить подарок (только если не получен)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { giftId } = await request.json()

    const gift = await prisma.balanceGift.findUnique({
      where: { id: giftId },
    })

    if (!gift) {
      return NextResponse.json({ error: "Подарок не найден" }, { status: 404 })
    }

    if (gift.senderId !== user.id) {
      return NextResponse.json({ error: "Это не ваш подарок" }, { status: 403 })
    }

    if (gift.status !== "PENDING") {
      return NextResponse.json({ error: "Подарок уже получен или отменён" }, { status: 400 })
    }

    // Возвращаем средства
    await prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: gift.amount } },
      })

      await tx.balanceGift.update({
        where: { id: giftId },
        data: { status: "CANCELLED" },
      })

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "REFUND",
          amount: gift.amount,
          balanceBefore: sender!.balance,
          balanceAfter: sender!.balance + gift.amount,
          description: `Возврат подарка`,
          status: "COMPLETED",
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel gift error:", error)
    return NextResponse.json({ error: "Ошибка отмены" }, { status: 500 })
  }
}
