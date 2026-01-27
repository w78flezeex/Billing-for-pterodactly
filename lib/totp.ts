import crypto from "crypto"

// Base32 алфавит
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

// Генерация секретного ключа для 2FA
export function generateSecret(length: number = 20): string {
  const buffer = crypto.randomBytes(length)
  let secret = ""
  
  for (let i = 0; i < buffer.length; i++) {
    secret += BASE32_ALPHABET[buffer[i] % 32]
  }
  
  return secret
}

// Декодирование Base32
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "")
  const buffer = Buffer.alloc(Math.floor(cleaned.length * 5 / 8))
  
  let bits = 0
  let value = 0
  let index = 0
  
  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = BASE32_ALPHABET.indexOf(cleaned[i])
    if (charIndex === -1) continue
    
    value = (value << 5) | charIndex
    bits += 5
    
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }
  
  return buffer.slice(0, index)
}

// Генерация TOTP кода
export function generateTOTP(secret: string, time?: number): string {
  const now = time || Math.floor(Date.now() / 1000)
  let counter = Math.floor(now / 30) // 30-секундный интервал
  
  // Конвертируем counter в 8-байтовый buffer
  const counterBuffer = Buffer.alloc(8)
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff
    counter >>>= 8
  }
  
  // HMAC-SHA1
  const key = base32Decode(secret)
  const hmac = crypto.createHmac("sha1", key)
  hmac.update(counterBuffer)
  const hash = hmac.digest()
  
  // Динамический truncation
  const offset = hash[hash.length - 1] & 0xf
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  
  const otp = binary % 1000000
  return otp.toString().padStart(6, "0")
}

// Верификация TOTP кода
export function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  const now = Math.floor(Date.now() / 1000)
  
  // Проверяем код в окне ±window
  for (let i = -window; i <= window; i++) {
    const time = now + i * 30
    if (generateTOTP(secret, time) === token) {
      return true
    }
  }
  
  return false
}

// Генерация URL для QR кода
export function generateOTPAuthURL(
  secret: string,
  email: string,
  issuer: string = "SwiftHost"
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

// Генерация резервных кодов
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  
  return codes
}

// Хеширование резервного кода для хранения
export function hashBackupCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.replace(/-/g, "").toUpperCase())
    .digest("hex")
}

// Проверка резервного кода
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashed = hashBackupCode(code)
  return hashedCodes.indexOf(hashed)
}
