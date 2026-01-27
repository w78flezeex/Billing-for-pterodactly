import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { pterodactyl } from "@/lib/pterodactyl"

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: "Не авторизован", status: 401 }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  
  if (dbUser?.role !== "ADMIN") return { error: "Нет доступа", status: 403 }
  return { user }
}

// GET - Получить настройки Pterodactyl
export async function GET() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const panelUrl = process.env.PTERODACTYL_URL || ""
    const apiKey = process.env.PTERODACTYL_API_KEY || ""
    const clientKey = process.env.PTERODACTYL_CLIENT_KEY || ""

    let status = { connected: false }

    // Проверяем подключение
    if (panelUrl && apiKey) {
      try {
        const nodes = await pterodactyl.getNodes()
        const locations = await pterodactyl.getLocations()
        const nests = await pterodactyl.getNests()

        status = {
          connected: true,
          nodes: (nodes as any[]).map((n: any) => ({
            id: n.attributes.id,
            name: n.attributes.name,
            location: n.attributes.location_id,
            memory: n.attributes.memory,
            disk: n.attributes.disk,
            servers: 0,
            status: "online",
          })),
          locations: (locations as any[]).map((l: any) => ({
            id: l.attributes.id,
            short: l.attributes.short,
            long: l.attributes.long,
          })),
          nests: (nests as any[]).map((n: any) => ({
            id: n.attributes.id,
            name: n.attributes.name,
            eggs: 0,
          })),
        } as any
      } catch {
        status = { connected: false }
      }
    }

    return NextResponse.json({
      panelUrl,
      apiKey: apiKey ? "***" + apiKey.slice(-8) : "",
      clientKey: clientKey ? "***" + clientKey.slice(-8) : "",
      status,
    })
  } catch (error) {
    console.error("Error getting pterodactyl settings:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

// PUT - Сохранить настройки (в .env файл или БД)
export async function PUT(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { panelUrl, apiKey, clientKey } = await request.json()

    // Сохраняем в Setting таблицу
    await prisma.setting.upsert({
      where: { key: "pterodactyl" },
      create: {
        key: "pterodactyl",
        value: {
          panelUrl: panelUrl || "",
          apiKey: apiKey || "",
          clientKey: clientKey || "",
        },
      },
      update: {
        value: {
          panelUrl: panelUrl || "",
          apiKey: apiKey || "",
          clientKey: clientKey || "",
        },
      },
    })

    // Примечание: для реального применения настроек нужен перезапуск сервера
    // или динамическая загрузка из БД в lib/pterodactyl.ts

    return NextResponse.json({ 
      success: true,
      message: "Настройки сохранены. Для применения перезапустите сервер или обновите .env файл.",
    })
  } catch (error) {
    console.error("Error saving pterodactyl settings:", error)
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 })
  }
}
