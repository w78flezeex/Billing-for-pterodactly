import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { nanoid } from "nanoid"
import { sendEmail } from "@/lib/email"

// Generate gift certificate code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "GIFT-"
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    if (i < 3) code += "-"
  }
  return code
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { code: { contains: search, mode: "insensitive" as const } },
        { recipientEmail: { contains: search, mode: "insensitive" as const } },
        { purchasedBy: { email: { contains: search, mode: "insensitive" as const } } },
        { redeemedBy: { email: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}
    
    const [certificates, total, stats] = await Promise.all([
      prisma.giftCertificate.findMany({
        where,
        include: {
          purchasedBy: { select: { email: true, name: true } },
          redeemedBy: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.giftCertificate.count({ where }),
      prisma.giftCertificate.aggregate({
        _count: true,
        _sum: { amount: true },
      }),
    ])
    
    const [activeCount, redeemedCount] = await Promise.all([
      prisma.giftCertificate.count({
        where: { isActive: true, redeemedAt: null },
      }),
      prisma.giftCertificate.count({
        where: { redeemedAt: { not: null } },
      }),
    ])
    
    return NextResponse.json({
      certificates,
      stats: {
        totalCertificates: stats._count,
        totalValue: stats._sum.amount || 0,
        activeCount,
        redeemedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: unknown) {
    console.error("Gift certificates GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    
    const { amount, message, recipientEmail, expiresAt } = await req.json()
    
    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Минимальная сумма: 100 ₽" }, { status: 400 })
    }
    
    // Generate unique code
    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.giftCertificate.findUnique({ where: { code } })
      if (!existing) break
      code = generateCode()
      attempts++
    }
    
    const certificate = await prisma.giftCertificate.create({
      data: {
        code,
        amount,
        balance: amount,
        message: message || null,
        recipientEmail: recipientEmail || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })
    
    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "GIFT_CERTIFICATE_CREATED",
        target: `certificate:${certificate.id}`,
        details: {
          code,
          amount,
          recipientEmail,
        },
      },
    })
    
    // Send email if recipient specified
    if (recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: "🎁 Вам подарен сертификат!",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px; text-align: center; }
    .gift-icon { font-size: 60px; margin-bottom: 20px; }
    .code { background: #f3f4f6; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .amount { font-size: 36px; font-weight: bold; color: #8b5cf6; margin: 20px 0; }
    .message { background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: left; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Подарочный сертификат</h1>
    </div>
    <div class="content">
      <div class="gift-icon">🎁</div>
      <p>Вам подарен сертификат на</p>
      <div class="amount">${amount.toLocaleString("ru-RU")} ₽</div>
      <p>Код для активации:</p>
      <div class="code">${code}</div>
      ${message ? `<div class="message">${message}</div>` : ""}
      <p style="color: #6b7280;">Введите этот код в разделе "Баланс" для активации</p>
      ${expiresAt ? `<p style="color: #ef4444;">Действителен до: ${new Date(expiresAt).toLocaleDateString("ru-RU")}</p>` : ""}
    </div>
    <div class="footer">
      Hosting Billing System
    </div>
  </div>
</body>
</html>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send gift certificate email:", emailError)
      }
    }
    
    return NextResponse.json({
      success: true,
      certificate,
    })
    
  } catch (error: unknown) {
    console.error("Gift certificate POST error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания" },
      { status: 500 }
    )
  }
}
