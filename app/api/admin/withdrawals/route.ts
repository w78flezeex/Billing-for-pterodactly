import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - List withdrawal requests (admin)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    // Build where clause
    const where: any = {}
    if (status && status !== "all" && status !== "") {
      where.status = status
    }

    // Fetch requests
    const requests = await prisma.withdrawalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate stats
    const pending = await prisma.withdrawalRequest.count({
      where: { status: "PENDING" },
    })

    const processing = await prisma.withdrawalRequest.count({
      where: { status: "PROCESSING" },
    })

    const pendingRequests = await prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amount: true },
    })

    // Completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedToday = await prisma.withdrawalRequest.findMany({
      where: {
        status: "COMPLETED",
        processedAt: { gte: today },
      },
    })

    const stats = {
      pending,
      processing,
      totalPending: pendingRequests._sum.amount || 0,
      completedToday: completedToday.length,
      completedAmount: completedToday.reduce((sum, r) => sum + r.amount, 0),
    }

    return NextResponse.json({ requests, stats })
  } catch (error) {
    console.error("Error fetching withdrawals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
