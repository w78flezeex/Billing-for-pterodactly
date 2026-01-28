import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const { code } = await req.json()
    
    if (!code) {
      return NextResponse.json({ error: "Код сертификата обязателен" }, { status: 400 })
    }
    
    // Find certificate
    const certificate = await prisma.giftCertificate.findUnique({
      where: { code: code.toUpperCase().trim() },
    })
    
    if (!certificate) {
      return NextResponse.json({ error: "Сертификат не найден" }, { status: 404 })
    }
    
    if (!certificate.isActive) {
      return NextResponse.json({ error: "Сертификат деактивирован" }, { status: 400 })
    }
    
    if (certificate.balance <= 0) {
      return NextResponse.json({ error: "Сертификат уже использован" }, { status: 400 })
    }
    
    if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Срок действия сертификата истёк" }, { status: 400 })
    }
    
    // Check if user already redeemed this certificate
    if (certificate.redeemedById && certificate.redeemedById !== user.id) {
      return NextResponse.json(
        { error: "Сертификат уже активирован другим пользователем" },
        { status: 400 }
      )
    }
    
    const amountToCredit = certificate.balance
    
    // Process redemption
    const result = await prisma.$transaction(async (tx) => {
      // Get current user balance
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      })
      
      if (!currentUser) throw new Error("Пользователь не найден")
      
      const balanceBefore = currentUser.balance
      const balanceAfter = balanceBefore + amountToCredit
      
      // Create transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.BONUS,
          amount: amountToCredit,
          balanceBefore,
          balanceAfter,
          description: `Подарочный сертификат ${certificate.code}`,
          status: PaymentStatus.COMPLETED,
          metadata: {
            certificateId: certificate.id,
            certificateCode: certificate.code,
          },
        },
      })
      
      // Update user balance
      await tx.user.update({
        where: { id: user.id },
        data: { balance: balanceAfter },
      })
      
      // Update certificate
      await tx.giftCertificate.update({
        where: { id: certificate.id },
        data: {
          balance: 0,
          redeemedById: user.id,
          redeemedAt: new Date(),
        },
      })
      
      return { balanceAfter, amountToCredit }
    })
    
    return NextResponse.json({
      success: true,
      amount: result.amountToCredit,
      newBalance: result.balanceAfter,
      message: `Сертификат активирован! На баланс зачислено ${result.amountToCredit} ₽`,
    })
    
  } catch (error: unknown) {
    console.error("Redeem gift certificate error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка активации" },
      { status: 500 }
    )
  }
}
