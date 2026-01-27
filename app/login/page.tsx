"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Shield, KeyRound } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, refreshUser, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [useBackupCode, setUseBackupCode] = useState(false)

  // Редирект если уже авторизован
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const targetPath = user.role?.toUpperCase() === "ADMIN" ? "/admin" : "/profile"
      router.push(targetPath)
    }
  }, [isAuthenticated, user, router, authLoading])

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Если уже авторизован, не показываем форму
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (data.requires2FA) {
        setRequires2FA(true)
        setUserId(data.userId)
        setIsLoading(false)
        return
      }
      
      if (res.ok) {
        // Обновляем данные пользователя для получения роли
        const userData = await refreshUser()
        const targetPath = userData?.role?.toUpperCase() === "ADMIN" ? "/admin" : "/profile"
        router.push(targetPath)
        router.refresh()
      } else {
        setError(data.error || "Ошибка при входе")
      }
    } catch (error) {
      setError("Ошибка соединения")
    }

    setIsLoading(false)
  }
  
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: twoFactorCode.replace(/-/g, ""),
          isBackupCode: useBackupCode,
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Обновляем данные пользователя для получения роли
        const userData = await refreshUser()
        const targetPath = userData?.role?.toUpperCase() === "ADMIN" ? "/admin" : "/profile"
        router.push(targetPath)
        router.refresh()
      } else {
        setError(data.error || "Неверный код")
      }
    } catch (error) {
      setError("Ошибка соединения")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </Link>
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-xl">
          {requires2FA ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Двухфакторная аутентификация</CardTitle>
                <CardDescription>
                  {useBackupCode 
                    ? "Введите резервный код" 
                    : "Введите код из приложения-аутентификатора"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handle2FASubmit} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {useBackupCode ? "Резервный код" : "Код подтверждения"}
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className="pl-10 text-center text-lg tracking-widest"
                        required
                        disabled={isLoading}
                        maxLength={useBackupCode ? 9 : 6}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      "Подтвердить"
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCode(!useBackupCode)
                        setTwoFactorCode("")
                        setError("")
                      }}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {useBackupCode 
                        ? "Использовать код из приложения" 
                        : "Использовать резервный код"}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false)
                        setTwoFactorCode("")
                        setError("")
                      }}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      <ArrowLeft className="inline mr-1 h-3 w-3" />
                      Назад к входу
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Server className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Вход в аккаунт</CardTitle>
                <CardDescription>
                  Введите данные для входа в панель управления
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Пароль</Label>
                      <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                        Забыли пароль?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      "Войти"
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Нет аккаунта?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      Зарегистрироваться
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
