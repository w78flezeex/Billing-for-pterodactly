import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Получить настройки платежей
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "payment_test_mode",
            "payment_min_amount",
            "payment_max_amount",
            "yookassa_enabled",
            "manual_payment_enabled",
          ],
        },
      },
    })

    // Преобразуем в объект
    const result: Record<string, any> = {
      testMode: true, // По умолчанию тестовый режим
      minAmount: 50,
      maxAmount: 100000,
      yookassaEnabled: false,
      manualPaymentEnabled: true,
    }

    settings.forEach((s) => {
      switch (s.key) {
        case "payment_test_mode":
          result.testMode = s.value as boolean
          break
        case "payment_min_amount":
          result.minAmount = s.value as number
          break
        case "payment_max_amount":
          result.maxAmount = s.value as number
          break
        case "yookassa_enabled":
          result.yookassaEnabled = s.value as boolean
          break
        case "manual_payment_enabled":
          result.manualPaymentEnabled = s.value as boolean
          break
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get payment settings error:", error)
    return NextResponse.json(
      { error: "Ошибка получения настроек" },
      { status: 500 }
    )
  }
}

// PUT - Обновить настройки платежей
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const body = await request.json()
    const { testMode, minAmount, maxAmount, yookassaEnabled, manualPaymentEnabled } = body

    // Обновляем настройки
    const updates = [
      { key: "payment_test_mode", value: testMode ?? true },
      { key: "payment_min_amount", value: minAmount ?? 50 },
      { key: "payment_max_amount", value: maxAmount ?? 100000 },
      { key: "yookassa_enabled", value: yookassaEnabled ?? false },
      { key: "manual_payment_enabled", value: manualPaymentEnabled ?? true },
    ]

    for (const update of updates) {
      await prisma.setting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update payment settings error:", error)
    return NextResponse.json(
      { error: "Ошибка сохранения настроек" },
      { status: 500 }
    )
  }
}
