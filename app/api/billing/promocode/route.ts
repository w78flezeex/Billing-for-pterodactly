import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { validatePromocode } from "@/lib/promocodes"
import { applyPromocodeToBalance } from "@/lib/billing"
import { PromocodeType } from "@prisma/client"

// POST - Применить промокод
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { code, orderAmount, planType } = body

    if (!code) {
      return NextResponse.json({ error: "Введите промокод" }, { status: 400 })
    }

    const result = await validatePromocode(code, user.id, orderAmount, planType)

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Если это бонус на баланс, сразу применяем
    if (result.promocode?.type === PromocodeType.BALANCE) {
      await applyPromocodeToBalance(user.id, result.promocode.id, result.promocode.value)
      
      return NextResponse.json({
        success: true,
        message: `Промокод применён! На ваш баланс зачислено ${result.promocode.value} ₽`,
        type: "balance",
        amount: result.promocode.value,
      })
    }

    // Для скидок возвращаем информацию
    return NextResponse.json({
      success: true,
      promocode: result.promocode,
      discount: result.discount,
      message: result.promocode?.type === PromocodeType.PERCENT
        ? `Скидка ${result.promocode.value}%`
        : `Скидка ${result.discount} ₽`,
    })
  } catch (error) {
    console.error("Apply promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при применении промокода" },
      { status: 500 }
    )
  }
}

// GET - Валидация промокода без применения
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const orderAmount = parseFloat(searchParams.get("amount") || "0")

    if (!code) {
      return NextResponse.json({ error: "Укажите промокод" }, { status: 400 })
    }

    const result = await validatePromocode(code, user.id, orderAmount)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error })
    }

    return NextResponse.json({
      valid: true,
      promocode: result.promocode,
      discount: result.discount,
    })
  } catch (error) {
    console.error("Validate promocode error:", error)
    return NextResponse.json(
      { error: "Ошибка при проверке промокода" },
      { status: 500 }
    )
  }
}
