import prisma from "@/lib/db"
import crypto from "crypto"

type WebhookEventType = 
  | "SERVER_CREATED"
  | "SERVER_DELETED"
  | "SERVER_EXPIRED"
  | "SERVER_RENEWED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "BALANCE_LOW"
  | "TICKET_CREATED"
  | "TICKET_REPLIED"

interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

// Отправить событие всем подписанным webhooks пользователя
export async function triggerWebhook(
  userId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
) {
  try {
    // Находим все активные webhooks пользователя с этим событием
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: { has: event },
      },
    })

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Отправляем на все webhooks параллельно
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const payloadStr = JSON.stringify(payload)
        
        // Создаём HMAC подпись
        const signature = crypto
          .createHmac("sha256", webhook.secret || "")
          .update(payloadStr)
          .digest("hex")

        const startTime = Date.now()
        let responseCode: number | null = null
        let responseBody: string | null = null
        let success = false

        try {
          const res = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature,
              "X-Webhook-Event": event,
            },
            body: payloadStr,
            signal: AbortSignal.timeout(10000), // 10 секунд таймаут
          })

          responseCode = res.status
          responseBody = await res.text().catch(() => null)
          success = res.ok

          // Сбрасываем счётчик ошибок при успехе
          if (success) {
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                failCount: 0,
                lastTriggeredAt: new Date(),
              },
            })
          } else {
            // Увеличиваем счётчик ошибок
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                failCount: { increment: 1 },
                lastTriggeredAt: new Date(),
              },
            })

            // Отключаем webhook после 10 неудачных попыток
            if (webhook.failCount >= 9) {
              await prisma.webhook.update({
                where: { id: webhook.id },
                data: { isActive: false },
              })
            }
          }
        } catch (error) {
          responseBody = error instanceof Error ? error.message : "Unknown error"
          
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              failCount: { increment: 1 },
              lastTriggeredAt: new Date(),
            },
          })
        }

        // Логируем выполнение
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            payload,
            responseCode,
            responseBody: responseBody?.slice(0, 1000) || null,
            success,
          },
        })

        return { webhookId: webhook.id, success }
      })
    )

    return results
  } catch (error) {
    console.error("Trigger webhook error:", error)
  }
}

// Отправить Telegram уведомление
export async function sendTelegramNotification(
  userId: string,
  message: string,
  type?: "payment" | "server" | "ticket"
) {
  try {
    // Получаем настройки Telegram пользователя
    const telegramUser = await prisma.telegramUser.findUnique({
      where: { userId },
    })

    if (!telegramUser || !telegramUser.isVerified) return

    // Проверяем настройки уведомлений
    if (type === "payment" && !telegramUser.notifyPayments) return
    if (type === "server" && !telegramUser.notifyServers) return
    if (type === "ticket" && !telegramUser.notifyTickets) return

    // Получаем токен бота из настроек
    const tokenSetting = await prisma.integrationSetting.findUnique({
      where: { key: "telegram_bot_token" },
    })

    const enabledSetting = await prisma.integrationSetting.findUnique({
      where: { key: "telegram_enabled" },
    })

    if (!tokenSetting || enabledSetting?.value !== "true") return

    // Расшифровываем токен
    const token = decryptToken(tokenSetting.value)

    // Отправляем сообщение
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramUser.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Send Telegram notification error:", error)
  }
}

// Расшифровка токена (такая же как в API)
function decryptToken(text: string): string {
  const ENCRYPTION_KEY = process.env.JWT_SECRET?.slice(0, 32) || "default-key-32-chars-needed!!!!"
  const parts = text.split(":")
  const iv = Buffer.from(parts.shift()!, "hex")
  const encryptedText = Buffer.from(parts.join(":"), "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// Записать в аудит лог
export async function logAudit(
  action: string,
  options: {
    userId?: string
    userEmail?: string
    entityType?: string
    entityId?: string
    oldValue?: unknown
    newValue?: unknown
    ipAddress?: string
    userAgent?: string
  }
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId || null,
        userEmail: options.userEmail || null,
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        oldValue: options.oldValue as object || null,
        newValue: options.newValue as object || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    })
  } catch (error) {
    console.error("Log audit error:", error)
  }
}
