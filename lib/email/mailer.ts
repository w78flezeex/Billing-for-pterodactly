import nodemailer from "nodemailer"
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  twoFactorEmail,
  serverCreatedEmail,
  serverExpiringEmail,
  paymentConfirmationEmail,
  ticketReplyEmail,
  newsletterEmail,
  securityAlertEmail,
} from "./templates/emails"

// ==================== ТИПЫ ====================

export type EmailType =
  | "welcome"
  | "verification"
  | "password_reset"
  | "two_factor"
  | "server_created"
  | "server_expiring"
  | "payment_confirmation"
  | "ticket_reply"
  | "newsletter"
  | "security_alert"

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

// ==================== КОНФИГУРАЦИЯ ====================

const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }

  return nodemailer.createTransport(config)
}

// ==================== УТИЛИТЫ ====================

// Замена переменных в шаблоне
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template

  // Заменяем стандартные переменные
  const defaultVariables = {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://cloudhost.ru",
    discordUrl: process.env.DISCORD_URL || "https://discord.gg/cloudhost",
    telegramUrl: process.env.TELEGRAM_URL || "https://t.me/cloudhost",
    twitterUrl: process.env.TWITTER_URL || "https://twitter.com/cloudhost",
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
  }

  const allVariables = { ...defaultVariables, ...variables }

  for (const [key, value] of Object.entries(allVariables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
  }

  return result
}

// Преобразование HTML в plain text
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim()
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

// Отправка email
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  try {
    const transporter = createTransporter()

    // Проверяем конфигурацию
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not configured, email not sent")
      return {
        success: false,
        error: "SMTP not configured",
      }
    }

    const mailOptions = {
      from: `"CloudHost" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: replaceVariables(options.html, {}),
      text: options.text || htmlToText(options.html),
      replyTo: options.replyTo,
      attachments: options.attachments,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent: ${info.messageId} to ${options.to}`)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Email send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ==================== ГОТОВЫЕ ФУНКЦИИ ДЛЯ ОТПРАВКИ ====================

// Приветственное письмо
export async function sendWelcomeEmail(
  to: string,
  data: { userName: string; email: string }
): Promise<SendResult> {
  const html = welcomeEmail({
    ...data,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  })

  return sendEmail({
    to,
    subject: "Добро пожаловать в CloudHost! 🎉",
    html,
  })
}

// Письмо подтверждения email
export async function sendVerificationEmail(
  to: string,
  data: { userName: string; verificationCode: string; token: string }
): Promise<SendResult> {
  const html = verificationEmail({
    userName: data.userName,
    verificationCode: data.verificationCode,
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.token}`,
    expiresIn: "24 часа",
  })

  return sendEmail({
    to,
    subject: "Подтвердите ваш email 📧",
    html,
  })
}

// Письмо сброса пароля
export async function sendPasswordResetEmail(
  to: string,
  data: { userName: string; token: string; ipAddress: string }
): Promise<SendResult> {
  const html = passwordResetEmail({
    userName: data.userName,
    resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.token}`,
    expiresIn: "1 час",
    ipAddress: data.ipAddress,
  })

  return sendEmail({
    to,
    subject: "Сброс пароля CloudHost 🔐",
    html,
  })
}

// Письмо с 2FA кодом
export async function sendTwoFactorEmail(
  to: string,
  data: { userName: string; code: string }
): Promise<SendResult> {
  const html = twoFactorEmail({
    userName: data.userName,
    code: data.code,
    expiresIn: "10 минут",
  })

  return sendEmail({
    to,
    subject: "Код подтверждения входа 🔑",
    html,
  })
}

// Письмо о создании сервера
export async function sendServerCreatedEmail(
  to: string,
  data: {
    userName: string
    serverName: string
    serverIp: string
    plan: string
    location: string
    os: string
    rootPassword?: string
  }
): Promise<SendResult> {
  const html = serverCreatedEmail({
    ...data,
    panelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/servers`,
  })

  return sendEmail({
    to,
    subject: `Сервер ${data.serverName} создан! 🚀`,
    html,
  })
}

// Письмо об истечении сервера
export async function sendServerExpiringEmail(
  to: string,
  data: {
    userName: string
    serverName: string
    serverIp: string
    expiresAt: string
    daysLeft: number
    renewalCost: string
    serverId: string
  }
): Promise<SendResult> {
  const html = serverExpiringEmail({
    userName: data.userName,
    serverName: data.serverName,
    serverIp: data.serverIp,
    expiresAt: data.expiresAt,
    daysLeft: data.daysLeft,
    renewalCost: data.renewalCost,
    renewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/servers/${data.serverId}/renew`,
  })

  const subject = data.daysLeft <= 1
    ? `⚠️ СРОЧНО: Сервер ${data.serverName} истекает!`
    : `Сервер ${data.serverName} истекает через ${data.daysLeft} дней`

  return sendEmail({ to, subject, html })
}

// Письмо о платеже
export async function sendPaymentConfirmationEmail(
  to: string,
  data: {
    userName: string
    transactionId: string
    amount: string
    method: string
    date: string
    newBalance: string
  }
): Promise<SendResult> {
  const html = paymentConfirmationEmail({
    ...data,
    historyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return sendEmail({
    to,
    subject: `Платёж ${data.amount} получен! 💰`,
    html,
  })
}

// Письмо об ответе на тикет
export async function sendTicketReplyEmail(
  to: string,
  data: {
    userName: string
    ticketId: string
    ticketSubject: string
    replyPreview: string
    replierName: string
  }
): Promise<SendResult> {
  const html = ticketReplyEmail({
    ...data,
    ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets/${data.ticketId}`,
  })

  return sendEmail({
    to,
    subject: `Ответ на тикет #${data.ticketId}: ${data.ticketSubject}`,
    html,
  })
}

// Рассылка
export async function sendNewsletterEmail(
  to: string | string[],
  data: {
    userName: string
    subject: string
    content: string
    ctaText?: string
    ctaUrl?: string
  }
): Promise<SendResult> {
  const html = newsletterEmail(data)

  return sendEmail({
    to,
    subject: data.subject,
    html,
  })
}

// Уведомление о безопасности
export async function sendSecurityAlertEmail(
  to: string,
  data: {
    userName: string
    alertType: "new_login" | "password_changed" | "2fa_enabled" | "2fa_disabled" | "suspicious_activity"
    details: {
      ipAddress?: string
      location?: string
      device?: string
      time: string
    }
  }
): Promise<SendResult> {
  const html = securityAlertEmail({
    ...data,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/security`,
  })

  const subjectMap = {
    new_login: "🔐 Новый вход в аккаунт",
    password_changed: "🔑 Пароль изменён",
    "2fa_enabled": "🛡️ 2FA включена",
    "2fa_disabled": "⚠️ 2FA отключена",
    suspicious_activity: "🚨 Подозрительная активность",
  }

  return sendEmail({
    to,
    subject: subjectMap[data.alertType],
    html,
  })
}

// ==================== МАССОВАЯ РАССЫЛКА ====================

export async function sendBulkEmail(
  recipients: Array<{ email: string; userName: string }>,
  subject: string,
  content: string,
  options?: {
    ctaText?: string
    ctaUrl?: string
    batchSize?: number
    delayMs?: number
  }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const batchSize = options?.batchSize || 50
  const delayMs = options?.delayMs || 100
  
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    const results = await Promise.all(
      batch.map(async (recipient) => {
        const result = await sendNewsletterEmail(recipient.email, {
          userName: recipient.userName,
          subject,
          content,
          ctaText: options?.ctaText,
          ctaUrl: options?.ctaUrl,
        })

        if (result.success) {
          sent++
        } else {
          failed++
          errors.push(`${recipient.email}: ${result.error}`)
        }

        return result
      })
    )

    // Задержка между батчами
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return { sent, failed, errors }
}
