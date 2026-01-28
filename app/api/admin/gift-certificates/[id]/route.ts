import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req)
    const { id } = await params
    
    const certificate = await prisma.giftCertificate.findUnique({
      where: { id },
    })
    
    if (!certificate) {
      return NextResponse.json({ error: "Сертификат не найден" }, { status: 404 })
    }
    
    if (certificate.redeemedAt) {
      return NextResponse.json(
        { error: "Невозможно деактивировать использованный сертификат" },
        { status: 400 }
      )
    }
    
    await prisma.giftCertificate.update({
      where: { id },
      data: { isActive: false },
    })
    
    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "GIFT_CERTIFICATE_DEACTIVATED",
        target: `certificate:${id}`,
        details: {
          code: certificate.code,
          amount: certificate.amount,
        },
      },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error: unknown) {
    console.error("Gift certificate DELETE error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка деактивации" },
      { status: 500 }
    )
  }
}
