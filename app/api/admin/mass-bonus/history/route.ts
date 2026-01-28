import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    // Get mass bonus history from admin logs
    const logs = await prisma.adminLog.findMany({
      where: { action: "MASS_BONUS_SENT" },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    
    // Get admin emails
    const adminIds = [...new Set(logs.map(l => l.adminId))]
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true },
    })
    
    const adminMap = new Map(admins.map(a => [a.id, a.email]))
    
    const history = logs.map(log => {
      const details = log.details as {
        userCount?: number
        amount?: number
        totalAmount?: number
        reason?: string
        success?: number
      } | null
      
      return {
        id: log.id,
        amount: details?.amount || 0,
        reason: details?.reason || "Бонус",
        userCount: details?.success || details?.userCount || 0,
        totalAmount: details?.totalAmount || 0,
        createdAt: log.createdAt.toISOString(),
        adminEmail: adminMap.get(log.adminId) || "Неизвестно",
      }
    })
    
    return NextResponse.json({ history })
    
  } catch (error: unknown) {
    console.error("Mass bonus history error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки" },
      { status: 500 }
    )
  }
}
