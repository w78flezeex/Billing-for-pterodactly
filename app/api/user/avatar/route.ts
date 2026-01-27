import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// POST - Загрузить аватар
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    // Проверяем тип файла
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Разрешены только изображения (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      )
    }

    // Проверяем размер (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Максимальный размер файла: 5MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Генерируем уникальное имя файла
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${user.id}-${Date.now()}.${ext}`
    
    // Создаём директорию для аватаров
    const uploadDir = path.join(process.cwd(), "public", "avatars")
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Обновляем пользователя
    const avatarUrl = `/avatars/${filename}`
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
    })
  } catch (error) {
    console.error("Upload avatar error:", error)
    return NextResponse.json(
      { error: "Ошибка при загрузке аватара" },
      { status: 500 }
    )
  }
}

// DELETE - Удалить аватар
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete avatar error:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении аватара" },
      { status: 500 }
    )
  }
}
