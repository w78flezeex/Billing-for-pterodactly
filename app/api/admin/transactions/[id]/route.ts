import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: "Не авторизован", status: 401 }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, id: true },
  })
  
  if (dbUser?.role !== "ADMIN") return { error: "Нет доступа", status: 403 }
  return { user: dbUser }
}

// GET - Получить транзакцию
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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

// PUT - Обновить статус транзакции (подтвердить/отменить)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { id } = await params
    const { action } = await request.json()

    if (!action || !["approve", "reject", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 })
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Транзакция уже обработана" },
        { status: 400 }
      )
    }

    let newStatus: "COMPLETED" | "FAILED" | "CANCELLED"
    let updateBalance = false

    switch (action) {
      case "approve":
        newStatus = "COMPLETED"
        updateBalance = true
        break
      case "reject":
        newStatus = "FAILED"
        break
      case "cancel":
        newStatus = "CANCELLED"
        break
      default:
        return NextResponse.json({ error: "Неверное действие" }, { status: 400 })
    }

    // Обновляем транзакцию и баланс
    if (updateBalance && transaction.type === "DEPOSIT") {
      const newBalance = transaction.user.balance + transaction.amount

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id },
          data: {
            status: newStatus,
            balanceAfter: newBalance,
          },
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: { balance: newBalance },
        }),
        prisma.adminLog.create({
          data: {
            adminId: check.user.id,
            action: `TRANSACTION_${action.toUpperCase()}`,
            target: `transaction:${id}`,
            details: {
              transactionId: id,
              amount: transaction.amount,
              userId: transaction.userId,
            },
          },
        }),
      ])

      // Создаём уведомление пользователю
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          type: "PAYMENT",
          title: "Платёж подтверждён",
          message: `Ваш платёж на сумму ${transaction.amount} ₽ успешно подтверждён. Баланс пополнен.`,
          link: "/billing",
        },
      })
    } else {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id },
          data: { status: newStatus },
        }),
        prisma.adminLog.create({
          data: {
            adminId: check.user.id,
            action: `TRANSACTION_${action.toUpperCase()}`,
            target: `transaction:${id}`,
            details: {
              transactionId: id,
              amount: transaction.amount,
              userId: transaction.userId,
            },
          },
        }),
      ])

      if (action === "reject") {
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: "PAYMENT",
            title: "Платёж отклонён",
            message: `Ваш платёж на сумму ${transaction.amount} ₽ был отклонён. Обратитесь в поддержку.`,
            link: "/tickets",
          },
        })
      }
    }

    // Генерируем ссылку на чек если подтверждено
    let receiptUrl = null
    if (action === "approve") {
      receiptUrl = `/api/billing/receipt/${id}`
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      receiptUrl,
    })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}
