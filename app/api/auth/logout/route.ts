import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken, deleteSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (token) {
      // Удаляем сессию из БД
      const payload = await verifyToken(token)
      if (payload) {
        try {
          await deleteSession(token)
        } catch {
          // Сессия уже удалена или не существует
        }
      }
    }

    // Удаляем cookie
    const response = NextResponse.json({ message: "Выход выполнен успешно" })
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Ошибка при выходе" },
      { status: 500 }
    )
  }
}
