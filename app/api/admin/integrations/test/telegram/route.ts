import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.JWT_SECRET?.slice(0, 32) || "default-key-32-chars-needed!!!!"

function decrypt(text: string): string {
  const parts = text.split(":")
  const iv = Buffer.from(parts.shift()!, "hex")
  const encryptedText = Buffer.from(parts.join(":"), "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    // Получаем токен из настроек
    const tokenSetting = await prisma.integrationSetting.findUnique({
      where: { key: "telegram_bot_token" },
    })

    if (!tokenSetting) {
      return NextResponse.json({ error: "Токен бота не настроен" }, { status: 400 })
    }

    const token = tokenSetting.isEncrypted ? decrypt(tokenSetting.value) : tokenSetting.value

    // Проверяем бота через Telegram API
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await res.json()

    if (!data.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.description || "Неверный токен" 
      })
    }

    return NextResponse.json({
      success: true,
      username: data.result.username,
      firstName: data.result.first_name,
      canJoinGroups: data.result.can_join_groups,
      canReadMessages: data.result.can_read_all_group_messages,
    })
  } catch (error) {
    console.error("Telegram test error:", error)
    return NextResponse.json({ error: "Ошибка тестирования" }, { status: 500 })
  }
}
