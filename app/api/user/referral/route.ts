import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getReferralInfo, regenerateReferralCode } from "@/lib/referrals"

// GET - Получить реферальную информацию
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const referralInfo = await getReferralInfo(user.id)

    return NextResponse.json(referralInfo)
  } catch (error) {
    console.error("Get referral info error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении реферальной информации" },
      { status: 500 }
    )
  }
}

// POST - Сгенерировать новый реферальный код
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const newCode = await regenerateReferralCode(user.id)

    return NextResponse.json({
      success: true,
      referralCode: newCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${newCode}`,
    })
  } catch (error) {
    console.error("Regenerate referral code error:", error)
    return NextResponse.json(
      { error: "Ошибка при генерации нового кода" },
      { status: 500 }
    )
  }
}
