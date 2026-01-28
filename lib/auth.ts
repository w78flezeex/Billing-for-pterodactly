import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import prisma from "./db"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret-key")

export interface JWTPayload {
  userId: string
  email: string
  role: string
  exp?: number
}

// Хеширование пароля
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Проверка пароля
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Создание JWT токена
export async function createToken(payload: Omit<JWTPayload, "exp">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

// Проверка JWT токена
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Получение текущего пользователя
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        company: true,
        role: true,
        balance: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return user
  } catch {
    return null
  }
}

// Создание сессии
export async function createSession(userId: string, token: string, userAgent?: string, ipAddress?: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  return prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })
}

// Удаление сессии
export async function deleteSession(token: string) {
  return prisma.session.delete({
    where: { token },
  })
}

// Проверка прав администратора - возвращает пользователя или null
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return null
  }
  return user
}

// Проверка авторизации - возвращает пользователя или null
export async function requireAuth() {
  return await getCurrentUser()
}
