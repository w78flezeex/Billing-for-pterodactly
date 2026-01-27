import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware для защиты и добавления security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // ==================== SECURITY HEADERS ====================
  
  // Защита от XSS атак
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Запрет встраивания в iframe (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Запрет MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy (ограничение доступа к API браузера)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe нужен для Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.yookassa.ru wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Strict Transport Security (HSTS) - только для production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // ==================== API RATE LIMITING HEADERS ====================
  
  // Добавляем CORS headers для API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Запрещаем доступ с других доменов к API
    const origin = request.headers.get('origin')
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    if (origin && origin !== allowedOrigin) {
      // Разрешаем только локальные запросы
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    } else {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: response.headers 
      })
    }
  }
  
  // ==================== ЗАЩИТА АДМИНСКИХ МАРШРУТОВ ====================
  
  // Проверяем cookie для админских маршрутов
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      // Редирект на страницу входа
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Дополнительную проверку роли делаем на сервере в API
  }
  
  // ==================== ЗАЩИТА ЛИЧНОГО КАБИНЕТА ====================
  
  const protectedPaths = ['/dashboard', '/servers', '/billing', '/tickets', '/settings', '/balance']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  if (isProtectedPath) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      // Сохраняем URL для редиректа после входа
      const callbackUrl = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    }
  }
  
  // ==================== БЛОКИРОВКА ПОДОЗРИТЕЛЬНЫХ ЗАПРОСОВ ====================
  
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname
  
  // Блокируем известные вредоносные паттерны
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /\<script/i, // XSS в URL
    /javascript:/i, // JavaScript protocol
    /vbscript:/i, // VBScript protocol
    /data:text\/html/i, // Data URI XSS
    /onload=/i, // Event handlers
    /onerror=/i,
    /onclick=/i,
    /%3Cscript/i, // URL encoded script
    /eval\(/i, // eval()
    /alert\(/i, // alert()
    /document\.cookie/i, // Cookie stealing
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /insert\s+into/i, // SQL injection
    /delete\s+from/i, // SQL injection
    /\bor\b\s+1\s*=\s*1/i, // SQL injection
    /\band\b\s+1\s*=\s*1/i, // SQL injection
  ]
  
  const fullUrl = request.url
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(path)) {
      console.warn(`[SECURITY] Blocked suspicious request: ${path} from ${request.headers.get('x-forwarded-for') || 'unknown'}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  // Блокируем вредоносные User-Agent
  const blockedUserAgents = [
    /sqlmap/i, // SQL injection tool
    /nikto/i, // Vulnerability scanner
    /nmap/i, // Port scanner
    /burpsuite/i, // Security scanner
    /havij/i, // SQL injection tool
    /acunetix/i, // Vulnerability scanner
    /nessus/i, // Vulnerability scanner
    /w3af/i, // Web attack framework
    /dirbuster/i, // Directory brute-force
    /gobuster/i, // Directory brute-force
    /python-requests.*not for legitimate/i, // Malicious scripts
  ]
  
  for (const pattern of blockedUserAgents) {
    if (pattern.test(userAgent)) {
      console.warn(`[SECURITY] Blocked scanner: ${userAgent}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  return response
}

// Указываем какие пути обрабатывает middleware
export const config = {
  matcher: [
    // Пропускаем статические файлы и Next.js внутренние маршруты
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
