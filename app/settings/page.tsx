"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Loader2,
  Shield,
  Smartphone,
  Key,
  Monitor,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  LogOut,
  Copy,
  Check,
  Bell,
  Mail,
  MessageSquare,
  Upload,
  Camera,
  User,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Session {
  id: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  isCurrent: boolean
}

interface LoginHistory {
  id: string
  ipAddress: string | null
  userAgent: string | null
  country: string | null
  city: string | null
  success: boolean
  createdAt: string
}

interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 2FA states
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [is2FALoading, setIs2FALoading] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState("")
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  
  // Notification states
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyTelegram, setNotifyTelegram] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState("")
  const [discordWebhook, setDiscordWebhook] = useState("")
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  
  // Avatar states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return
      
      try {
        const [sessionsRes, notificationsRes] = await Promise.all([
          fetch("/api/user/sessions"),
          fetch("/api/user/notifications"),
        ])

        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.sessions || [])
          setLoginHistory(data.loginHistory || [])
        }

        if (notificationsRes.ok) {
          const data = await notificationsRes.json()
          if (data.settings) {
            setNotifyEmail(data.settings.notifyEmail)
            setNotifyTelegram(data.settings.notifyTelegram)
            setTelegramChatId(data.settings.telegramChatId || "")
            setDiscordWebhook(data.settings.discordWebhook || "")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [isAuthenticated, authLoading])

  // 2FA Functions
  const setup2FA = async () => {
    setIs2FALoading(true)
    setTwoFactorError("")
    
    try {
      const res = await fetch("/api/auth/2fa", { method: "POST" })
      const data = await res.json()
      
      if (res.ok) {
        setTwoFactorSetup(data)
      } else {
        setTwoFactorError(data.error || "Ошибка при настройке 2FA")
      }
    } catch {
      setTwoFactorError("Ошибка подключения к серверу")
    } finally {
      setIs2FALoading(false)
    }
  }

  const verify2FA = async () => {
    setIs2FALoading(true)
    setTwoFactorError("")
    
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setBackupCodes(data.backupCodes || twoFactorSetup?.backupCodes || [])
        setShowBackupCodes(true)
        setTwoFactorSetup(null)
        setTwoFactorCode("")
        await refreshUser()
      } else {
        setTwoFactorError(data.error || "Неверный код")
      }
    } catch {
      setTwoFactorError("Ошибка подключения к серверу")
    } finally {
      setIs2FALoading(false)
    }
  }

  const disable2FA = async () => {
    setIs2FALoading(true)
    
    try {
      const res = await fetch("/api/auth/2fa", { method: "DELETE" })
      
      if (res.ok) {
        await refreshUser()
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error)
    } finally {
      setIs2FALoading(false)
    }
  }

  // Session Functions
  const terminateSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/user/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error("Error terminating session:", error)
    }
  }

  const terminateAllSessions = async () => {
    try {
      const res = await fetch("/api/user/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.isCurrent))
      }
    } catch (error) {
      console.error("Error terminating sessions:", error)
    }
  }

  // Notification Functions
  const saveNotifications = async () => {
    setIsSavingNotifications(true)
    
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          notifyTelegram,
          telegramChatId,
          discordWebhook,
        }),
      })
      
      if (!res.ok) {
        console.error("Error saving notifications")
      }
    } catch (error) {
      console.error("Error saving notifications:", error)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  // Avatar Functions
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploadingAvatar(true)
    setAvatarError("")
    
    const formData = new FormData()
    formData.append("avatar", file)
    
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })
      
      const data = await res.json()
      
      if (res.ok) {
        await refreshUser()
      } else {
        setAvatarError(data.error || "Ошибка при загрузке")
      }
    } catch {
      setAvatarError("Ошибка подключения к серверу")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const deleteAvatar = async () => {
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" })
      
      if (res.ok) {
        await refreshUser()
      }
    } catch (error) {
      console.error("Error deleting avatar:", error)
    }
  }

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: "Неизвестно", os: "Неизвестно" }
    
    let browser = "Браузер"
    let os = "ОС"
    
    if (ua.includes("Chrome")) browser = "Chrome"
    else if (ua.includes("Firefox")) browser = "Firefox"
    else if (ua.includes("Safari")) browser = "Safari"
    else if (ua.includes("Edge")) browser = "Edge"
    
    if (ua.includes("Windows")) os = "Windows"
    else if (ua.includes("Mac")) os = "macOS"
    else if (ua.includes("Linux")) os = "Linux"
    else if (ua.includes("Android")) os = "Android"
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
    
    return { browser, os }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Настройки</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Tabs defaultValue="security" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Безопасность
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Monitor className="h-4 w-4 mr-2" />
                Сессии
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Уведомления
              </TabsTrigger>
              <TabsTrigger value="avatar">
                <User className="h-4 w-4 mr-2" />
                Аватар
              </TabsTrigger>
            </TabsList>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {/* 2FA Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Двухфакторная аутентификация
                  </CardTitle>
                  <CardDescription>
                    Дополнительная защита вашего аккаунта
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show backup codes after enabling */}
                  {showBackupCodes && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Сохраните резервные коды!</h4>
                          <p className="text-sm text-muted-foreground">
                            Эти коды понадобятся для входа, если вы потеряете доступ к приложению аутентификации.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-background rounded-lg font-mono text-sm mb-4">
                        {backupCodes.map((code, i) => (
                          <span key={i}>{code}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                          {copied ? "Скопировано" : "Копировать"}
                        </Button>
                        <Button size="sm" onClick={() => setShowBackupCodes(false)}>
                          Я сохранил коды
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 2FA Setup */}
                  {twoFactorSetup && (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                        <img
                          src={twoFactorSetup.qrCode}
                          alt="QR Code"
                          className="w-48 h-48 mb-4"
                        />
                        <p className="text-sm text-muted-foreground text-center mb-2">
                          Отсканируйте QR-код в приложении аутентификации
                        </p>
                        <code className="px-3 py-1 bg-background rounded text-sm">
                          {twoFactorSetup.secret}
                        </code>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Введите код из приложения</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="000000"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                          />
                          <Button onClick={verify2FA} disabled={twoFactorCode.length !== 6 || is2FALoading}>
                            {is2FALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подтвердить"}
                          </Button>
                        </div>
                        {twoFactorError && (
                          <p className="text-sm text-red-500">{twoFactorError}</p>
                        )}
                      </div>
                      
                      <Button variant="ghost" onClick={() => setTwoFactorSetup(null)}>
                        Отмена
                      </Button>
                    </div>
                  )}

                  {/* 2FA Status */}
                  {!twoFactorSetup && !showBackupCodes && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user?.twoFactorEnabled ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">2FA включена</p>
                              <p className="text-sm text-muted-foreground">
                                Ваш аккаунт защищён двухфакторной аутентификацией
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">2FA отключена</p>
                              <p className="text-sm text-muted-foreground">
                                Рекомендуем включить для дополнительной защиты
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {user?.twoFactorEnabled ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={is2FALoading}>
                              Отключить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Отключить 2FA?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это снизит уровень защиты вашего аккаунта.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={disable2FA}>
                                Отключить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button onClick={setup2FA} disabled={is2FALoading}>
                          {is2FALoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Включить 2FA
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Активные сессии
                      </CardTitle>
                      <CardDescription>
                        Устройства, на которых выполнен вход
                      </CardDescription>
                    </div>
                    {sessions.length > 1 && (
                      <Button variant="outline" size="sm" onClick={terminateAllSessions}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Завершить все
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const { browser, os } = parseUserAgent(session.userAgent)
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {browser} на {os}
                                {session.isCurrent && (
                                  <Badge variant="secondary" className="text-xs">
                                    Текущая
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                {session.ipAddress || "Неизвестный IP"}
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                {new Date(session.createdAt).toLocaleString("ru-RU")}
                              </p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => terminateSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Login History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    История входов
                  </CardTitle>
                  <CardDescription>
                    Последние попытки входа в аккаунт
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loginHistory.map((login) => (
                      <div
                        key={login.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {login.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm">
                              {login.success ? "Успешный вход" : "Неудачная попытка"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {login.ipAddress} • {new Date(login.createdAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                        </div>
                        {login.country && (
                          <span className="text-sm text-muted-foreground">
                            {login.city}, {login.country}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Настройки уведомлений
                  </CardTitle>
                  <CardDescription>
                    Выберите, как вы хотите получать уведомления
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email уведомления</p>
                        <p className="text-sm text-muted-foreground">
                          Получать уведомления на почту
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifyEmail}
                      onCheckedChange={setNotifyEmail}
                    />
                  </div>

                  <Separator />

                  {/* Telegram */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Telegram уведомления</p>
                          <p className="text-sm text-muted-foreground">
                            Получать уведомления в Telegram
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifyTelegram}
                        onCheckedChange={setNotifyTelegram}
                      />
                    </div>
                    {notifyTelegram && (
                      <div className="pl-8 space-y-2">
                        <Label htmlFor="telegram">Chat ID</Label>
                        <Input
                          id="telegram"
                          placeholder="123456789"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Получите Chat ID у бота @userinfobot
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Discord */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Discord Webhook</p>
                        <p className="text-sm text-muted-foreground">
                          Получать уведомления в Discord канал
                        </p>
                      </div>
                    </div>
                    <div className="pl-8 space-y-2">
                      <Label htmlFor="discord">Webhook URL</Label>
                      <Input
                        id="discord"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={discordWebhook}
                        onChange={(e) => setDiscordWebhook(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={saveNotifications} disabled={isSavingNotifications}>
                    {isSavingNotifications && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Сохранить настройки
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Avatar Tab */}
            <TabsContent value="avatar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Аватар профиля
                  </CardTitle>
                  <CardDescription>
                    Загрузите изображение для вашего профиля
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить
                      </Button>
                      {user?.avatar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deleteAvatar}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      )}
                      {avatarError && (
                        <p className="text-sm text-red-500">{avatarError}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Поддерживаемые форматы: JPEG, PNG, WebP, GIF. Максимальный размер: 5MB.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}
