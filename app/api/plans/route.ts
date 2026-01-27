import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET - Получить публичные тарифы для клиентов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // GAME_HOSTING, VPS, WEB_HOSTING, DEDICATED
    const locationId = searchParams.get("locationId")

    // Получаем активные локации
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        flag: true,
      },
    })

    // Формируем условия для тарифов
    const where: any = {
      isActive: true,
    }

    if (type) {
      where.type = type
    }

    if (locationId) {
      where.locations = {
        some: {
          locationId,
          OR: [
            { stock: -1 },
            { stock: { gt: 0 } },
          ],
        },
      }
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        price: true,
        priceYearly: true,
        features: true,
        specs: true,
        isPopular: true,
        pterodactylNestId: true,
        pterodactylEggId: true,
        locations: {
          where: {
            location: { isActive: true },
            OR: [
              { stock: -1 },
              { stock: { gt: 0 } },
            ],
          },
          select: {
            stock: true,
            location: {
              select: {
                id: true,
                name: true,
                country: true,
                city: true,
                flag: true,
              },
            },
          },
        },
      },
    })

    // Группируем по типу для удобства
    const plansByType = {
      GAME_HOSTING: plans.filter(p => p.type === "GAME_HOSTING"),
      VPS: plans.filter(p => p.type === "VPS"),
      WEB_HOSTING: plans.filter(p => p.type === "WEB_HOSTING"),
      DEDICATED: plans.filter(p => p.type === "DEDICATED"),
    }

    return NextResponse.json({ 
      locations,
      plans,
      plansByType,
    })
  } catch (error) {
    console.error("Get public plans error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении тарифов" },
      { status: 500 }
    )
  }
}
