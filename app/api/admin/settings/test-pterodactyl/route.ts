import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const { panelUrl, apiKey } = await request.json()

    if (!panelUrl || !apiKey) {
      return NextResponse.json({ error: "Заполните URL и API ключ" }, { status: 400 })
    }

    // Clean up URL
    const baseUrl = panelUrl.replace(/\/$/, "")

    // Test connection to Pterodactyl API
    const response = await fetch(`${baseUrl}/api/application/users`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: "Неверный API ключ" }, { status: 401 })
      }
      if (response.status === 403) {
        return NextResponse.json({ error: "API ключ не имеет прав доступа" }, { status: 403 })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    // Also test nodes endpoint
    const nodesResponse = await fetch(`${baseUrl}/api/application/nodes`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    const nodesData = nodesResponse.ok ? await nodesResponse.json() : null

    return NextResponse.json({ 
      success: true, 
      message: "Подключение к Pterodactyl успешно!",
      stats: {
        users: data.meta?.pagination?.total || 0,
        nodes: nodesData?.meta?.pagination?.total || 0,
      }
    })
  } catch (error: any) {
    console.error("Pterodactyl test error:", error)
    return NextResponse.json({ 
      error: error.message || "Ошибка подключения к Pterodactyl" 
    }, { status: 500 })
  }
}
