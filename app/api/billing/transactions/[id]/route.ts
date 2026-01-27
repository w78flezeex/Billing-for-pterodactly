import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { getYooKassaPayment } from "@/lib/payments/yookassa"
import { depositBalance } from "@/lib/billing"

// GET - Получить транзакцию и проверить статус в YooKassa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 })
    }

    // Проверяем что транзакция принадлежит пользователю (или админ)
    if (transaction.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    // Если транзакция ещё PENDING и есть paymentId - проверяем в YooKassa
    if (transaction.status === "PENDING" && transaction.paymentId) {
      const yooPayment = await getYooKassaPayment(transaction.paymentId)
      
      if (yooPayment && yooPayment.status === "succeeded" && yooPayment.paid) {
        // Платёж успешен - зачисляем средства
        await depositBalance({
          userId: transaction.userId,
          type: "DEPOSIT",
          amount: transaction.amount,
          description: `Пополнение баланса (YooKassa)`,
          paymentMethod: "yookassa",
          paymentId: transaction.paymentId,
        })

        // Обновляем статус
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "COMPLETED" },
        })

        // Создаём уведомление
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: "PAYMENT",
            title: "Баланс пополнен",
            message: `На ваш баланс зачислено ${transaction.amount} ₽`,
          },
        })

        transaction.status = "COMPLETED"
      } else if (yooPayment && yooPayment.status === "canceled") {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "CANCELLED" },
        })
        transaction.status = "CANCELLED"
      }
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Get transaction error:", error)
    return NextResponse.json(
      { error: "Ошибка получения транзакции" },
      { status: 500 }
    )
  }
}
