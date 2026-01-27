import prisma from "./db"
import { TransactionType, PaymentStatus } from "@prisma/client"

/**
 * Сервис для управления балансом и транзакциями
 */

interface CreateTransactionParams {
  userId: string
  type: TransactionType
  amount: number
  description?: string
  paymentMethod?: string
  paymentId?: string
  metadata?: Record<string, unknown>
}

// Пополнение баланса
export async function depositBalance(params: CreateTransactionParams) {
  const { userId, amount, description, paymentMethod, paymentId, metadata } = params

  return prisma.$transaction(async (tx) => {
    // Получаем текущий баланс
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) throw new Error("Пользователь не найден")

    const balanceBefore = user.balance
    const balanceAfter = balanceBefore + amount

    // Создаём транзакцию
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT,
        amount,
        balanceBefore,
        balanceAfter,
        description: description || "Пополнение баланса",
        paymentMethod,
        paymentId,
        status: PaymentStatus.COMPLETED,
        metadata: metadata as object | undefined,
      },
    })

    // Обновляем баланс пользователя
    await tx.user.update({
      where: { id: userId },
      data: { balance: balanceAfter },
    })

    return transaction
  })
}

// Списание с баланса
export async function withdrawBalance(
  userId: string,
  amount: number,
  description?: string
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) throw new Error("Пользователь не найден")
    if (user.balance < amount) throw new Error("Недостаточно средств")

    const balanceBefore = user.balance
    const balanceAfter = balanceBefore - amount

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.PURCHASE,
        amount: -amount,
        balanceBefore,
        balanceAfter,
        description: description || "Списание",
        status: PaymentStatus.COMPLETED,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { balance: balanceAfter },
    })

    return transaction
  })
}

// Реферальный бонус
export async function addReferralBonus(userId: string, amount: number, referredUserId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true, referralBalance: true },
    })

    if (!user) throw new Error("Пользователь не найден")

    const balanceBefore = user.balance
    const balanceAfter = balanceBefore + amount

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.REFERRAL,
        amount,
        balanceBefore,
        balanceAfter,
        description: `Реферальный бонус за пользователя`,
        status: PaymentStatus.COMPLETED,
        metadata: { referredUserId },
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: {
        balance: balanceAfter,
        referralBalance: user.referralBalance + amount,
      },
    })

    return transaction
  })
}

// Применение промокода на баланс
export async function applyPromocodeToBalance(
  userId: string,
  promocodeId: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) throw new Error("Пользователь не найден")

    // Проверяем, не использовался ли промокод
    const existingUsage = await tx.promocodeUsage.findUnique({
      where: {
        userId_promocodeId: {
          userId,
          promocodeId,
        },
      },
    })

    if (existingUsage) throw new Error("Промокод уже использован")

    const balanceBefore = user.balance
    const balanceAfter = balanceBefore + amount

    // Создаём транзакцию
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.PROMOCODE,
        amount,
        balanceBefore,
        balanceAfter,
        description: "Бонус по промокоду",
        status: PaymentStatus.COMPLETED,
        metadata: { promocodeId },
      },
    })

    // Обновляем баланс
    await tx.user.update({
      where: { id: userId },
      data: { balance: balanceAfter },
    })

    // Записываем использование промокода
    await tx.promocodeUsage.create({
      data: {
        userId,
        promocodeId,
        amount,
      },
    })

    // Увеличиваем счётчик использования промокода
    await tx.promocode.update({
      where: { id: promocodeId },
      data: { usedCount: { increment: 1 } },
    })

    return transaction
  })
}

// Получение истории транзакций
export async function getTransactionHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ])

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Возврат средств
export async function refundTransaction(transactionId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const originalTransaction = await tx.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!originalTransaction) throw new Error("Транзакция не найдена")
    if (originalTransaction.type !== TransactionType.PURCHASE) {
      throw new Error("Можно вернуть только покупки")
    }

    const user = await tx.user.findUnique({
      where: { id: originalTransaction.userId },
      select: { balance: true },
    })

    if (!user) throw new Error("Пользователь не найден")

    const refundAmount = Math.abs(originalTransaction.amount)
    const balanceBefore = user.balance
    const balanceAfter = balanceBefore + refundAmount

    const refundTransaction = await tx.transaction.create({
      data: {
        userId: originalTransaction.userId,
        type: TransactionType.REFUND,
        amount: refundAmount,
        balanceBefore,
        balanceAfter,
        description: reason || "Возврат средств",
        status: PaymentStatus.COMPLETED,
        metadata: { originalTransactionId: transactionId },
      },
    })

    await tx.user.update({
      where: { id: originalTransaction.userId },
      data: { balance: balanceAfter },
    })

    return refundTransaction
  })
}
