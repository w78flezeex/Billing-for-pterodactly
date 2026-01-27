import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

// GET - Get all servers with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ]
    }
    
    if (status) {
      where.status = status
    }

    const [servers, total] = await Promise.all([
      prisma.server.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          plan: {
            select: { id: true, name: true, type: true, price: true }
          },
          location: {
            select: { id: true, name: true, country: true, flag: true }
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.server.count({ where }),
    ])

    return NextResponse.json({
      servers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
