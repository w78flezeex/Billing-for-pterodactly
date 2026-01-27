/**
 * Security Middleware and Utilities
 * Защита от различных атак и эксплойтов
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "./db"

// Rate limiting - хранение в памяти (для продакшена использовать Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Окно в миллисекундах
  maxRequests: number  // Максимум запросов в окне
}

// Конфигурации для разных эндпоинтов
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },  // 10 попыток за 15 минут
  api: { windowMs: 60 * 1000, maxRequests: 100 },  // 100 запросов в минуту
  payment: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 платежей в минуту
  admin: { windowMs: 60 * 1000, maxRequests: 200 },  // 200 запросов в минуту для админов
}

/**
 * Проверка rate limit
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = RATE_LIMITS.api
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier
  
  let record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.windowMs }
    rateLimitMap.set(key, record)
  }
  
  record.count++
  
  const allowed = record.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - record.count)
  const resetIn = Math.max(0, record.resetTime - now)
  
  return { allowed, remaining, resetIn }
}

/**
 * Получение IP адреса из запроса
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return "unknown"
}

/**
 * Санитизация строки от XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return ""
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

/**
 * Проверка на SQL injection паттерны
 */
export function hasSQLInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--)|(;)|(\/\*)|(\*\/)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i,
    /'.*?--/,
    /'\s*OR\s*'1'\s*=\s*'1/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Валидация email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Валидация пароля (минимум 8 символов, буквы и цифры)
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== "string") return false
  
  return password.length >= 8 && 
         password.length <= 128 &&
         /[a-zA-Z]/.test(password) && 
         /[0-9]/.test(password)
}

/**
 * Валидация UUID/CUID
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== "string") return false
  
  // CUID формат
  const cuidRegex = /^c[a-z0-9]{24}$/
  // UUID формат
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  return cuidRegex.test(id) || uuidRegex.test(id)
}

/**
 * Валидация числа (для сумм)
 */
export function isValidAmount(amount: unknown, min = 0, max = 1000000): boolean {
  if (typeof amount !== "number" || isNaN(amount)) return false
  return amount >= min && amount <= max && Number.isFinite(amount)
}

/**
 * Проверка CSRF токена
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Для API routes проверяем Origin/Referer
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const host = request.headers.get("host")
  
  if (!host) return false
  
  // Проверяем что запрос пришел с того же домена
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (!host.includes(originUrl.host)) {
        return false
      }
    } catch {
      return false
    }
  }
  
  return true
}

/**
 * Генерация случайного токена
 */
export function generateSecureToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}

/**
 * Логирование подозрительной активности
 */
export async function logSecurityEvent(params: {
  type: "RATE_LIMIT" | "SQL_INJECTION" | "XSS" | "CSRF" | "BRUTE_FORCE" | "UNAUTHORIZED"
  ip: string
  userId?: string
  path: string
  details?: string
}) {
  try {
    // Логируем в консоль
    console.warn(`[SECURITY] ${params.type}:`, {
      ip: params.ip,
      userId: params.userId,
      path: params.path,
      details: params.details,
      timestamp: new Date().toISOString(),
    })
    
    // TODO: Сохранять в БД или отправлять в систему мониторинга
  } catch (error) {
    console.error("Error logging security event:", error)
  }
}

/**
 * Middleware для защиты API
 */
export function createSecurityHeaders(): Headers {
  const headers = new Headers()
  
  // Защита от кликджекинга
  headers.set("X-Frame-Options", "DENY")
  headers.set("Content-Security-Policy", "frame-ancestors 'none'")
  
  // Защита от XSS
  headers.set("X-XSS-Protection", "1; mode=block")
  headers.set("X-Content-Type-Options", "nosniff")
  
  // Referrer Policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Permissions Policy
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  
  return headers
}

/**
 * Wrapper для защищённых API routes
 */
export async function withSecurity(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig
    requireAuth?: boolean
    requireAdmin?: boolean
    validateCSRF?: boolean
  } = {}
): Promise<NextResponse> {
  const ip = getClientIP(request)
  const path = request.nextUrl.pathname
  
  // Rate limiting
  if (options.rateLimit) {
    const { allowed, remaining, resetIn } = checkRateLimit(`${ip}:${path}`, options.rateLimit)
    
    if (!allowed) {
      await logSecurityEvent({
        type: "RATE_LIMIT",
        ip,
        path,
        details: `Limit exceeded: ${remaining} remaining, reset in ${resetIn}ms`,
      })
      
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": String(remaining),
          }
        }
      )
    }
  }
  
  // CSRF protection для мутирующих запросов
  if (options.validateCSRF && ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!validateCSRFToken(request)) {
      await logSecurityEvent({
        type: "CSRF",
        ip,
        path,
      })
      
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      )
    }
  }
  
  // Выполняем основной обработчик
  try {
    const response = await handler()
    
    // Добавляем security headers
    const securityHeaders = createSecurityHeaders()
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })
    
    return response
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Очистка старых записей rate limit (вызывать периодически)
 */
export function cleanupRateLimitCache() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Автоочистка каждые 5 минут
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000)
}
