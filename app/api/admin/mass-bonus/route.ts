import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    
    const { userIds, amount, reason, sendEmail: shouldSendEmail } = await req.json()
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Выберите пользователей" }, { status: 400 })
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Укажите корректную сумму" }, { status: 400 })
    }
    
    let success = 0
    let failed = 0
    const totalAmount = amount * userIds.length
    
    // Process each user
    for (const userId of userIds) {
      try {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, balance: true, name: true },
          })
          
          if (!user) throw new Error("User not found")
          
          const balanceBefore = user.balance
          const balanceAfter = balanceBefore + amount
          
          // Create transaction
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: TransactionType.BONUS,
              amount,
              balanceBefore,
              balanceAfter,
              description: reason || "Бонус от администратора",
              status: PaymentStatus.COMPLETED,
              metadata: {
                adminId: admin.id,
                adminEmail: admin.email,
                massBonusReason: reason,
              },
            },
          })
          
          // Update balance
          await tx.user.update({
            where: { id: user.id },
            data: { balance: balanceAfter },
          })
          
          // Send email notification
          if (shouldSendEmail) {
            try {
              await sendEmail({
                to: user.email,
                subject: "🎁 Вам начислен бонус!",
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 40px; text-align: center; }
    .amount { font-size: 48px; font-weight: bold; color: #22c55e; margin: 20px 0; }
    .reason { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Вам начислен бонус!</h1>
    </div>
    <div class="content">
      <p>Здравствуйте${user.name ? `, ${user.name}` : ""}!</p>
      <p>На ваш баланс зачислено:</p>
      <div class="amount">+${amount.toLocaleString("ru-RU")} ₽</div>
      ${reason ? `<div class="reason">${reason}</div>` : ""}
      <p>Ваш новый баланс: <strong>${balanceAfter.toLocaleString("ru-RU")} ₽</strong></p>
    </div>
    <div class="footer">
      Hosting Billing System
    </div>
  </div>
</body>
</html>
                `,
              })
            } catch (emailErr) {
              console.error("Failed to send bonus email:", emailErr)
            }
          }
        })
        
        success++
      } catch (err) {
        console.error(`Failed to process bonus for user ${userId}:`, err)
        failed++
      }
    }
    
    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "MASS_BONUS_SENT",
        details: {
          userCount: userIds.length,
          amount,
          totalAmount,
          reason,
          success,
          failed,
        },
      },
    })
    
    return NextResponse.json({
      success,
      failed,
      totalAmount: amount * success,
    })
    
  } catch (error: unknown) {
    console.error("Mass bonus error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка начисления" },
      { status: 500 }
    )
  }
}
