import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const severity = searchParams.get("severity")
    
    const skip = (page - 1) * limit
    
    const where = {
      ...(status && status !== "all" && { status }),
      ...(severity && severity !== "all" && { severity }),
    }
    
    const [alerts, total, stats] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
        orderBy: [
          { status: "asc" },
          { severity: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.fraudAlert.count({ where }),
      prisma.fraudAlert.groupBy({
        by: ["status"],
        _count: true,
      }),
    ])
    
    const statusCounts = Object.fromEntries(
      stats.map(s => [s.status, s._count])
    )
    
    const severityStats = await prisma.fraudAlert.groupBy({
      by: ["severity"],
      _count: true,
    })
    
    return NextResponse.json({
      alerts,
      stats: {
        totalAlerts: total,
        pending: statusCounts.PENDING || 0,
        investigating: statusCounts.INVESTIGATING || 0,
        confirmed: statusCounts.CONFIRMED || 0,
        resolved: statusCounts.RESOLVED || 0,
        bySeverity: Object.fromEntries(severityStats.map(s => [s.severity, s._count])),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
    
  } catch (error: unknown) {
    console.error("Fraud alerts GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки" },
      { status: 500 }
    )
  }
}
