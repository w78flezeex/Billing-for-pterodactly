import prisma from "./db"
import { PromocodeType, PlanType } from "@prisma/client"

/**
 * Сервис для работы с промокодами
 */

interface ValidatePromocodeResult {
  valid: boolean
  error?: string
  promocode?: {
    id: string
    code: string
    type: PromocodeType
    value: number
    minAmount?: number
  }
  discount?: number
}

// Валидация промокода
export async function validatePromocode(
  code: string,
  userId: string,
  orderAmount?: number,
  planType?: PlanType
): Promise<ValidatePromocodeResult> {
  const promocode = await prisma.promocode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      usages: {
        where: { userId },
      },
    },
  })

  if (!promocode) {
    return { valid: false, error: "Промокод не найден" }
  }

  if (!promocode.isActive) {
    return { valid: false, error: "Промокод неактивен" }
  }

  // Проверка срока действия
  const now = new Date()
  if (promocode.validFrom > now) {
    return { valid: false, error: "Промокод ещё не активен" }
  }

  if (promocode.validUntil && promocode.validUntil < now) {
    return { valid: false, error: "Срок действия промокода истёк" }
  }

  // Проверка лимита использований
  if (promocode.maxUses && promocode.usedCount >= promocode.maxUses) {
    return { valid: false, error: "Промокод больше недоступен" }
  }

  // Проверка использования пользователем
  if (promocode.usages.length >= promocode.maxUsesPerUser) {
    return { valid: false, error: "Вы уже использовали этот промокод" }
  }

  // Проверка минимальной суммы
  if (promocode.minAmount && orderAmount && orderAmount < promocode.minAmount) {
    return {
      valid: false,
      error: `Минимальная сумма заказа: ${promocode.minAmount} ₽`,
    }
  }

  // Проверка типа плана
  if (promocode.planTypes.length > 0 && planType) {
    if (!promocode.planTypes.includes(planType)) {
      return { valid: false, error: "Промокод не применим к этому типу услуги" }
    }
  }

  // Рассчитываем скидку
  let discount = 0
  if (orderAmount) {
    if (promocode.type === PromocodeType.FIXED) {
      discount = Math.min(promocode.value, orderAmount)
    } else if (promocode.type === PromocodeType.PERCENT) {
      discount = (orderAmount * promocode.value) / 100
    } else if (promocode.type === PromocodeType.BALANCE) {
      discount = promocode.value // Бонус на баланс
    }
  }

  return {
    valid: true,
    promocode: {
      id: promocode.id,
      code: promocode.code,
      type: promocode.type,
      value: promocode.value,
      minAmount: promocode.minAmount || undefined,
    },
    discount,
  }
}

// Создание промокода (для админов)
export async function createPromocode(data: {
  code: string
  type: PromocodeType
  value: number
  minAmount?: number
  maxUses?: number
  maxUsesPerUser?: number
  validFrom?: Date
  validUntil?: Date
  planTypes?: PlanType[]
}) {
  return prisma.promocode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minAmount: data.minAmount,
      maxUses: data.maxUses,
      maxUsesPerUser: data.maxUsesPerUser || 1,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      planTypes: data.planTypes || [],
      isActive: true,
    },
  })
}

// Получение всех промокодов (для админов)
export async function getAllPromocodes() {
  return prisma.promocode.findMany({
    include: {
      _count: {
        select: { usages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

// Деактивация промокода
export async function deactivatePromocode(promocodeId: string) {
  return prisma.promocode.update({
    where: { id: promocodeId },
    data: { isActive: false },
  })
}
