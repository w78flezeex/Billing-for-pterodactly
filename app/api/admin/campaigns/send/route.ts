import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import nodemailer from "nodemailer"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.JWT_SECRET?.slice(0, 32) || "default-key-32-chars-needed!!!!"

function decrypt(text: string): string {
  try {
    const parts = text.split(":")
    const iv = Buffer.from(parts.shift()!, "hex")
    const encryptedText = Buffer.from(parts.join(":"), "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch {
    return text
  }
}

async function getSmtpConfig() {
  const settings = await prisma.integrationSetting.findMany({
    where: {
      key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_enabled"] },
    },
  })

  const config: Record<string, string> = {}
  settings.forEach((s) => {
    config[s.key] = s.isEncrypted ? decrypt(s.value) : s.value
  })

  return config
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { campaignId } = await request.json()

    // Получаем кампанию
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Кампания не найдена" }, { status: 404 })
    }

    if (campaign.status === "SENT" || campaign.status === "SENDING") {
      return NextResponse.json({ error: "Кампания уже отправлена" }, { status: 400 })
    }

    // Получаем SMTP настройки
    const smtpConfig = await getSmtpConfig()

    if (smtpConfig.smtp_enabled !== "true") {
      return NextResponse.json({ error: "SMTP не настроен" }, { status: 400 })
    }

    // Получаем список получателей
    let whereClause: Record<string, unknown> = { isActive: true }

    switch (campaign.targetType) {
      case "ACTIVE_USERS":
        whereClause.lastLoginAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        break
      case "INACTIVE_USERS":
        whereClause.lastLoginAt = { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        break
      case "WITH_SERVERS":
        whereClause.servers = { some: {} }
        break
      case "WITHOUT_SERVERS":
        whereClause.servers = { none: {} }
        break
      case "CUSTOM":
        if (campaign.targetFilter) {
          whereClause = { ...whereClause, ...campaign.targetFilter as object }
        }
        break
    }

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { email: true, name: true },
    })

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Нет получателей" }, { status: 400 })
    }

    // Обновляем статус
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    })

    // Создаём транспорт
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port) || 587,
      secure: smtpConfig.smtp_port === "465",
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass,
      },
    })

    // Отправляем письма (в фоне)
    let sentCount = 0

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: smtpConfig.smtp_from || smtpConfig.smtp_user,
          to: recipient.email,
          subject: campaign.subject,
          html: campaign.content.replace(/\{\{name\}\}/g, recipient.name || "Пользователь"),
        })
        sentCount++
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error)
      }
    }

    // Обновляем статус и счётчик
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        sentCount,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      sentCount,
      totalRecipients: recipients.length,
    })
  } catch (error) {
    console.error("Send campaign error:", error)
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 })
  }
}
