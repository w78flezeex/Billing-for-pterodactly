import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { pterodactyl } from "@/lib/pterodactyl"

// GET - Получить реальный статус сервера из Pterodactyl
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        pterodactylIdentifier: true,
        pterodactylServerId: true,
        status: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 })
    }

    // Проверяем права доступа
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (server.userId !== user.id && dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    // Если нет Pterodactyl идентификатора - возвращаем локальный статус
    if (!server.pterodactylIdentifier) {
      return NextResponse.json({
        status: server.status,
        pterodactyl: null,
        message: "Сервер не связан с Pterodactyl",
      })
    }

    // Проверяем настройки Pterodactyl
    if (!process.env.PTERODACTYL_URL || !process.env.PTERODACTYL_CLIENT_KEY) {
      return NextResponse.json({
        status: server.status,
        pterodactyl: null,
        message: "Pterodactyl не настроен",
      })
    }

    try {
      // Получаем реальный статус из Pterodactyl
      const resources = await pterodactyl.getServerResources(server.pterodactylIdentifier)

      // Определяем статус
      let realStatus = server.status
      if (resources.is_suspended) {
        realStatus = "SUSPENDED"
      } else {
        switch (resources.current_state) {
          case "running":
            realStatus = "ACTIVE"
            break
          case "starting":
            realStatus = "INSTALLING"
            break
          case "stopping":
          case "offline":
            realStatus = "ACTIVE" // Сервер активен, но выключен
            break
        }
      }

      // Обновляем статус в БД если он изменился
      if (realStatus !== server.status && realStatus !== "ACTIVE") {
        await prisma.server.update({
          where: { id },
          data: { status: realStatus as any },
        })
      }

      return NextResponse.json({
        status: realStatus,
        pterodactyl: {
          state: resources.current_state,
          isSuspended: resources.is_suspended,
          resources: {
            memoryBytes: resources.resources.memory_bytes,
            cpuAbsolute: resources.resources.cpu_absolute,
            diskBytes: resources.resources.disk_bytes,
            networkRxBytes: resources.resources.network_rx_bytes,
            networkTxBytes: resources.resources.network_tx_bytes,
            uptime: resources.resources.uptime,
          },
        },
      })
    } catch (pterodactylError: any) {
      console.error("Pterodactyl status error:", pterodactylError)
      
      return NextResponse.json({
        status: server.status,
        pterodactyl: null,
        error: "Не удалось получить статус из Pterodactyl",
      })
    }
  } catch (error) {
    console.error("Server status error:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}
