import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import crypto from "crypto"

// Шифрование токенов
const ENCRYPTION_KEY = process.env.JWT_SECRET?.slice(0, 32) || "default-key-32-chars-needed!!!!"
const IV_LENGTH = 16

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

function decrypt(text: string): string {
  const parts = text.split(":")
  const iv = Buffer.from(parts.shift()!, "hex")
  const encryptedText = Buffer.from(parts.join(":"), "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return null
  }
  return user
}

// GET - Получить все настройки интеграций
export async function GET() {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const settings = await prisma.integrationSetting.findMany()

    // Расшифровываем и маскируем секретные данные
    const result = settings.map((s) => ({
      ...s,
      value: s.isEncrypted ? maskSecret(decrypt(s.value)) : s.value,
      rawValue: s.isEncrypted ? undefined : s.value, // Полное значение только для незашифрованных
    }))

    return NextResponse.json({ settings: result })
  } catch (error) {
    console.error("Get integrations error:", error)
    return NextResponse.json({ error: "Ошибка получения настроек" }, { status: 500 })
  }
}

// POST - Сохранить настройку
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { key, value, isEncrypted, description } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Укажите key и value" }, { status: 400 })
    }

    const processedValue = isEncrypted ? encrypt(value) : value

    const setting = await prisma.integrationSetting.upsert({
      where: { key },
      update: {
        value: processedValue,
        isEncrypted: isEncrypted || false,
        description,
      },
      create: {
        key,
        value: processedValue,
        isEncrypted: isEncrypted || false,
        description,
      },
    })

    return NextResponse.json({
      success: true,
      setting: {
        ...setting,
        value: isEncrypted ? maskSecret(value) : value,
      },
    })
  } catch (error) {
    console.error("Save integration error:", error)
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 })
  }
}

// DELETE - Удалить настройку
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { key } = await request.json()

    await prisma.integrationSetting.delete({
      where: { key },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete integration error:", error)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••"
  return value.slice(0, 4) + "••••••••" + value.slice(-4)
}
