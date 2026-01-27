import prisma from "./db"

/**
 * Реферальная система
 */

const REFERRAL_BONUS_PERCENT = 10 // 10% от первого платежа реферала
const MIN_REFERRAL_BONUS = 50 // Минимум 50 рублей
const MAX_REFERRAL_BONUS = 500 // Максимум 500 рублей

// Получить реферальную информацию пользователя
export async function getReferralInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralBalance: true,
      referredBy: {
        select: {
          id: true,
          name: true,
        },
      },
      referredUsers: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) throw new Error("Пользователь не найден")

  const totalReferrals = user.referredUsers.length

  return {
    referralCode: user.referralCode,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user.referralCode}`,
    referralBalance: user.referralBalance,
    totalReferrals,
    referredBy: user.referredBy,
    referrals: user.referredUsers,
  }
}

// Применить реферальный код при регистрации
export async function applyReferralCode(userId: string, referralCode: string) {
  // Находим пригласившего пользователя
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  })

  if (!referrer) {
    throw new Error("Реферальный код не найден")
  }

  if (referrer.id === userId) {
    throw new Error("Нельзя использовать собственный реферальный код")
  }

  // Обновляем пользователя
  await prisma.user.update({
    where: { id: userId },
    data: { referredById: referrer.id },
  })

  return { success: true }
}

// Начислить реферальный бонус (вызывается при первом платеже реферала)
export async function processReferralBonus(referralUserId: string, paymentAmount: number) {
  const referral = await prisma.user.findUnique({
    where: { id: referralUserId },
    select: {
      referredById: true,
      referredBy: true,
    },
  })

  if (!referral?.referredById) {
    return null // Нет реферера
  }

  // Рассчитываем бонус
  let bonus = (paymentAmount * REFERRAL_BONUS_PERCENT) / 100
  bonus = Math.max(MIN_REFERRAL_BONUS, Math.min(MAX_REFERRAL_BONUS, bonus))

  // Проверяем, был ли уже начислен бонус за этого пользователя
  const existingBonus = await prisma.transaction.findFirst({
    where: {
      userId: referral.referredById,
      type: "REFERRAL",
      metadata: {
        path: ["referredUserId"],
        equals: referralUserId,
      },
    },
  })

  if (existingBonus) {
    return null // Бонус уже начислен
  }

  // Начисляем бонус рефереру
  const referrer = await prisma.user.findUnique({
    where: { id: referral.referredById },
    select: { balance: true, referralBalance: true },
  })

  if (!referrer) return null

  const transaction = await prisma.$transaction(async (tx) => {
    // Создаём транзакцию
    const trans = await tx.transaction.create({
      data: {
        userId: referral.referredById!,
        type: "REFERRAL",
        amount: bonus,
        balanceBefore: referrer.balance,
        balanceAfter: referrer.balance + bonus,
        description: `Реферальный бонус`,
        status: "COMPLETED",
        metadata: { referredUserId: referralUserId },
      },
    })

    // Обновляем баланс
    await tx.user.update({
      where: { id: referral.referredById! },
      data: {
        balance: { increment: bonus },
        referralBalance: { increment: bonus },
      },
    })

    // Создаём уведомление
    await tx.notification.create({
      data: {
        userId: referral.referredById!,
        type: "PAYMENT",
        title: "Реферальный бонус",
        message: `Вы получили ${bonus.toFixed(0)} ₽ за приглашённого друга!`,
      },
    })

    return trans
  })

  return transaction
}

// Генерация нового реферального кода
export async function regenerateReferralCode(userId: string) {
  const newCode = generateReferralCode()

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: newCode },
  })

  return newCode
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
