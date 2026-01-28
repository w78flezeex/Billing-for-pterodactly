import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const { host, port, user: smtpUser, password, secure, fromEmail, fromName } = await request.json()

    if (!host || !port || !smtpUser || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
    }

    // Create test transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: password,
      },
    })

    // Verify connection
    await transporter.verify()

    // Optionally send test email to admin
    await transporter.sendMail({
      from: `"${fromName || 'Test'}" <${fromEmail || smtpUser}>`,
      to: user.email,
      subject: "Тест SMTP - GameHost",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>✅ SMTP работает!</h2>
          <p>Это тестовое письмо для проверки настроек SMTP.</p>
          <p><strong>Сервер:</strong> ${host}:${port}</p>
          <p><strong>Время:</strong> ${new Date().toLocaleString("ru-RU")}</p>
        </div>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: "SMTP соединение успешно! Тестовое письмо отправлено." 
    })
  } catch (error: any) {
    console.error("SMTP test error:", error)
    return NextResponse.json({ 
      error: error.message || "Ошибка подключения к SMTP" 
    }, { status: 500 })
  }
}
