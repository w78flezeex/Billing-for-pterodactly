import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { pterodactyl } from "@/lib/pterodactyl"

// Проверка админ-прав
async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Не авторизован", status: 401 }
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, id: true },
  })
  
  if (dbUser?.role !== "ADMIN") {
    return { error: "Нет доступа", status: 403 }
  }
  
  return { user: dbUser }
}

// GET - Получить данные из Pterodactyl (nests, eggs, locations, nodes)
export async function GET(request: NextRequest) {
  try {
    const check = await checkAdmin()
    if ("error" in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const nestId = searchParams.get("nestId")

    const result: {
      nests?: any[]
      eggs?: any[]
      locations?: any[]
      nodes?: any[]
    } = {}

    if (type === "all" || type === "nests") {
      try {
        const nests = await pterodactyl.getNests()
        result.nests = nests.map((nest: any) => ({
          id: nest.attributes.id,
          uuid: nest.attributes.uuid,
          name: nest.attributes.name,
          author: nest.attributes.author,
          description: nest.attributes.description,
        }))
      } catch (e) {
        result.nests = []
      }
    }

    if (type === "eggs" && nestId) {
      try {
        const eggs = await pterodactyl.getEggs(parseInt(nestId))
        result.eggs = eggs.map((egg: any) => ({
          id: egg.attributes.id,
          uuid: egg.attributes.uuid,
          name: egg.attributes.name,
          author: egg.attributes.author,
          description: egg.attributes.description,
          dockerImage: egg.attributes.docker_image,
          startup: egg.attributes.startup,
        }))
      } catch (e) {
        result.eggs = []
      }
    }

    if (type === "all" || type === "locations") {
      try {
        const locations = await pterodactyl.getLocations()
        result.locations = locations.map((loc: any) => ({
          id: loc.attributes.id,
          short: loc.attributes.short,
          long: loc.attributes.long,
        }))
      } catch (e) {
        result.locations = []
      }
    }

    if (type === "all" || type === "nodes") {
      try {
        const nodes = await pterodactyl.getNodes()
        result.nodes = nodes.map((node: any) => ({
          id: node.attributes.id,
          uuid: node.attributes.uuid,
          name: node.attributes.name,
          description: node.attributes.description,
          locationId: node.attributes.location_id,
          fqdn: node.attributes.fqdn,
          memory: node.attributes.memory,
          memoryOverallocate: node.attributes.memory_overallocate,
          disk: node.attributes.disk,
          diskOverallocate: node.attributes.disk_overallocate,
        }))
      } catch (e) {
        result.nodes = []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Pterodactyl API error:", error)
    return NextResponse.json(
      { error: "Ошибка при получении данных из Pterodactyl" },
      { status: 500 }
    )
  }
}
