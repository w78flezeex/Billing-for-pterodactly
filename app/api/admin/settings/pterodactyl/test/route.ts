import { NextResponse } from "next/server"
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

// POST - Тест подключения к Pterodactyl
export async function POST() {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    if (!process.env.PTERODACTYL_URL || !process.env.PTERODACTYL_API_KEY) {
      return NextResponse.json({ 
        connected: false,
        error: "Pterodactyl не настроен в переменных окружения"
      })
    }

    try {
      const nodes = await pterodactyl.getNodes()
      const locations = await pterodactyl.getLocations()
      const nests = await pterodactyl.getNests()

      return NextResponse.json({
        connected: true,
        nodes: (nodes as any[]).map((n: any) => ({
          id: n.attributes.id,
          name: n.attributes.name,
          location: n.attributes.location_id,
          memory: n.attributes.memory,
          disk: n.attributes.disk,
          servers: n.attributes.allocated_resources?.memory || 0,
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
      })
    } catch (error: any) {
      return NextResponse.json({ 
        connected: false,
        error: error.message || "Не удалось подключиться к Pterodactyl"
      })
    }
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json({ connected: false, error: "Ошибка" }, { status: 500 })
  }
}
