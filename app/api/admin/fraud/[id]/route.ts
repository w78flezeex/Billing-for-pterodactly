import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req)
    const { id } = await params
    
    const { status, note } = await req.json()
    
    const alert = await prisma.fraudAlert.findUnique({
      where: { id },
    })
    
    if (!alert) {
      return NextResponse.json({ error: "Алерт не найден" }, { status: 404 })
    }
    
    await prisma.fraudAlert.update({
      where: { id },
      data: {
        status,
        reviewNote: note || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    })
    
    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "FRAUD_ALERT_REVIEWED",
        target: `alert:${id}`,
        details: {
          userId: alert.userId,
          type: alert.type,
          oldStatus: alert.status,
          newStatus: status,
          note,
        },
      },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error: unknown) {
    console.error("Fraud alert update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка обновления" },
      { status: 500 }
    )
  }
}
