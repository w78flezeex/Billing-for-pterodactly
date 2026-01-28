"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  ArrowLeft,
  Save,
  Globe,
  Mail,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Database,
  Server,
  Settings,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  TestTube,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteUrl: string
  supportEmail: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  darkModeDefault: boolean
  registrationEnabled: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
}

interface SmtpSettings {
  host: string
  port: number
  user: string
  password: string
  fromName: string
  fromEmail: string
  secure: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  websocketEnabled: boolean
  notifyOnNewUser: boolean
  notifyOnNewOrder: boolean
  notifyOnNewTicket: boolean
  notifyOnServerExpiring: boolean
  expirationWarningDays: number
}

interface SecuritySettings {
  twoFactorRequired: boolean
  recaptchaEnabled: boolean
  recaptchaSiteKey: string
  recaptchaSecretKey: string
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  requireStrongPassword: boolean
}

interface PterodactylSettings {
  panelUrl: string
  apiKey: string
  autoSuspend: boolean
  autoDelete: boolean
  deleteDays: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Settings states
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: "GameHost",
    siteDescription: "Игровой хостинг нового уровня",
    siteUrl: "https://example.com",
    supportEmail: "support@example.com",
    logoUrl: "/logo.svg",
    faviconUrl: "/favicon.ico",
    primaryColor: "#0ea5e9",
    darkModeDefault: true,
    registrationEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: "Сайт находится на техническом обслуживании",
  })

  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    host: "",
    port: 587,
    user: "",
    password: "",
    fromName: "GameHost",
    fromEmail: "noreply@example.com",
    secure: false,
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    websocketEnabled: true,
    notifyOnNewUser: true,
    notifyOnNewOrder: true,
    notifyOnNewTicket: true,
    notifyOnServerExpiring: true,
    expirationWarningDays: 3,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorRequired: false,
    recaptchaEnabled: false,
    recaptchaSiteKey: "",
    recaptchaSecretKey: "",
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    requireStrongPassword: true,
  })

  const [pterodactylSettings, setPterodactylSettings] = useState<PterodactylSettings>({
    panelUrl: "",
    apiKey: "",
    autoSuspend: true,
    autoDelete: false,
    deleteDays: 7,
  })

  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | null>>({})

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      if (data.user?.role !== "ADMIN") {
        router.push("/profile")
        return
      }
      setLoading(false)
      fetchSettings()
    } catch (error) {
      router.push("/login")
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        if (data.site) setSiteSettings(prev => ({ ...prev, ...data.site }))
        if (data.smtp) setSmtpSettings(prev => ({ ...prev, ...data.smtp }))
        if (data.notifications) setNotificationSettings(prev => ({ ...prev, ...data.notifications }))
        if (data.security) setSecuritySettings(prev => ({ ...prev, ...data.security }))
        if (data.pterodactyl) setPterodactylSettings(prev => ({ ...prev, ...data.pterodactyl }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const saveSettings = async (type: string, data: any) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      })
      if (res.ok) {
        toast.success("Настройки сохранены")
      } else {
        const error = await res.json()
        toast.error(error.message || "Ошибка сохранения")
      }
    } catch (error) {
      toast.error("Ошибка сохранения настроек")
    } finally {
      setSaving(false)
    }
  }

  const testSmtp = async () => {
    setTestResults(prev => ({ ...prev, smtp: null }))
    try {
      const res = await fetch("/api/admin/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      })
      if (res.ok) {
        setTestResults(prev => ({ ...prev, smtp: "success" }))
        toast.success("SMTP соединение успешно!")
      } else {
        setTestResults(prev => ({ ...prev, smtp: "error" }))
        toast.error("Ошибка SMTP соединения")
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, smtp: "error" }))
      toast.error("Ошибка тестирования SMTP")
    }
  }

  const testPterodactyl = async () => {
    setTestResults(prev => ({ ...prev, pterodactyl: null }))
    try {
      const res = await fetch("/api/admin/settings/test-pterodactyl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pterodactylSettings),
      })
      if (res.ok) {
        setTestResults(prev => ({ ...prev, pterodactyl: "success" }))
        toast.success("Подключение к Pterodactyl успешно!")
      } else {
        setTestResults(prev => ({ ...prev, pterodactyl: "error" }))
        toast.error("Ошибка подключения к Pterodactyl")
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, pterodactyl: "error" }))
      toast.error("Ошибка тестирования Pterodactyl")
    }
  }

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Настройки</h1>
                <p className="text-sm text-muted-foreground">
                  Конфигурация системы
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Общие</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Безопасность</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Интеграции</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Информация о сайте</CardTitle>
                  <CardDescription>Основные данные вашего сайта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название сайта</Label>
                    <Input
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={siteSettings.siteDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL сайта</Label>
                    <Input
                      value={siteSettings.siteUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email поддержки</Label>
                    <Input
                      type="email"
                      value={siteSettings.supportEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Внешний вид</CardTitle>
                  <CardDescription>Настройки оформления</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL логотипа</Label>
                    <Input
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Основной цвет</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer"
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                      />
                      <Input
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Тёмная тема по умолчанию</p>
                      <p className="text-sm text-muted-foreground">Для новых пользователей</p>
                    </div>
                    <Switch
                      checked={siteSettings.darkModeDefault}
                      onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, darkModeDefault: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Режимы работы</CardTitle>
                  <CardDescription>Управление доступностью сайта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Регистрация</p>
                      <p className="text-sm text-muted-foreground">Разрешить регистрацию новых пользователей</p>
                    </div>
                    <Switch
                      checked={siteSettings.registrationEnabled}
                      onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, registrationEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-orange-500/50 bg-orange-500/5">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Режим обслуживания
                      </p>
                      <p className="text-sm text-muted-foreground">Закрыть сайт для посетителей</p>
                    </div>
                    <Switch
                      checked={siteSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, maintenanceMode: checked })}
                    />
                  </div>
                  {siteSettings.maintenanceMode && (
                    <div className="space-y-2">
                      <Label>Сообщение для посетителей</Label>
                      <Textarea
                        value={siteSettings.maintenanceMessage}
                        onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMessage: e.target.value })}
                      />
                    </div>
                  )}
                  <Button onClick={() => saveSettings("site", siteSettings)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>SMTP Настройки</CardTitle>
                  <CardDescription>Конфигурация для отправки email уведомлений</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>SMTP Хост</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Порт</Label>
                      <Input
                        type="number"
                        placeholder="587"
                        value={smtpSettings.port || ""}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) || 587 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Пользователь</Label>
                      <Input
                        placeholder="user@gmail.com"
                        value={smtpSettings.user}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Пароль</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.smtp ? "text" : "password"}
                          placeholder="••••••••"
                          value={smtpSettings.password}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePassword("smtp")}
                        >
                          {showPasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Имя отправителя</Label>
                      <Input
                        placeholder="GameHost"
                        value={smtpSettings.fromName}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email отправителя</Label>
                      <Input
                        type="email"
                        placeholder="noreply@example.com"
                        value={smtpSettings.fromEmail}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={smtpSettings.secure}
                      onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, secure: checked })}
                    />
                    <Label>Использовать SSL/TLS</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveSettings("smtp", smtpSettings)} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={testSmtp}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Тест соединения
                      {testResults.smtp === "success" && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                      {testResults.smtp === "error" && <X className="h-4 w-4 ml-2 text-red-500" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Настройки уведомлений</CardTitle>
                  <CardDescription>Управление системой оповещений</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Каналы уведомлений</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-xs text-muted-foreground">Письма на почту</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Push</p>
                            <p className="text-xs text-muted-foreground">Браузер</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">WebSocket</p>
                            <p className="text-xs text-muted-foreground">Реалтайм</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.websocketEnabled}
                          onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, websocketEnabled: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">События для администраторов</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { key: "notifyOnNewUser", label: "Новый пользователь", desc: "Уведомлять о регистрациях" },
                        { key: "notifyOnNewOrder", label: "Новый заказ", desc: "Уведомлять о покупках" },
                        { key: "notifyOnNewTicket", label: "Новый тикет", desc: "Уведомлять о обращениях" },
                        { key: "notifyOnServerExpiring", label: "Истечение сервера", desc: "Напоминание об оплате" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                            onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [item.key]: checked })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Предупреждение об истечении (дней)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={notificationSettings.expirationWarningDays}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, expirationWarningDays: parseInt(e.target.value) || 3 })}
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      За сколько дней до истечения отправлять напоминание
                    </p>
                  </div>

                  <Button onClick={() => saveSettings("notifications", notificationSettings)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Аутентификация</CardTitle>
                  <CardDescription>Настройки входа и сессий</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Время сессии (минуты)</Label>
                      <Input
                        type="number"
                        min="5"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 60 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Макс. попыток входа</Label>
                      <Input
                        type="number"
                        min="3"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Блокировка (минуты)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={securitySettings.lockoutDuration}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Обязательная 2FA</p>
                      <p className="text-sm text-muted-foreground">Требовать двухфакторную аутентификацию</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorRequired}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorRequired: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Пароли</CardTitle>
                  <CardDescription>Требования к паролям пользователей</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Минимальная длина пароля</Label>
                    <Input
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) || 8 })}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Сложные пароли</p>
                      <p className="text-sm text-muted-foreground">Требовать буквы, цифры и спецсимволы</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireStrongPassword}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>reCAPTCHA</CardTitle>
                  <CardDescription>Защита форм от ботов</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Включить reCAPTCHA</p>
                      <p className="text-sm text-muted-foreground">Google reCAPTCHA v3</p>
                    </div>
                    <Switch
                      checked={securitySettings.recaptchaEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, recaptchaEnabled: checked })}
                    />
                  </div>
                  {securitySettings.recaptchaEnabled && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Site Key</Label>
                        <Input
                          value={securitySettings.recaptchaSiteKey}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, recaptchaSiteKey: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.recaptcha ? "text" : "password"}
                            value={securitySettings.recaptchaSecretKey}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, recaptchaSecretKey: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => togglePassword("recaptcha")}
                          >
                            {showPasswords.recaptcha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button onClick={() => saveSettings("security", securitySettings)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Pterodactyl Panel
                  </CardTitle>
                  <CardDescription>Подключение к панели управления серверами</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>URL панели</Label>
                      <Input
                        placeholder="https://panel.example.com"
                        value={pterodactylSettings.panelUrl}
                        onChange={(e) => setPterodactylSettings({ ...pterodactylSettings, panelUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API ключ</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.pterodactyl ? "text" : "password"}
                          placeholder="ptla_..."
                          value={pterodactylSettings.apiKey}
                          onChange={(e) => setPterodactylSettings({ ...pterodactylSettings, apiKey: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => togglePassword("pterodactyl")}
                        >
                          {showPasswords.pterodactyl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Автоматизация</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Авто-приостановка</p>
                        <p className="text-sm text-muted-foreground">Приостанавливать при истечении оплаты</p>
                      </div>
                      <Switch
                        checked={pterodactylSettings.autoSuspend}
                        onCheckedChange={(checked) => setPterodactylSettings({ ...pterodactylSettings, autoSuspend: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg border-red-500/50 bg-red-500/5">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Авто-удаление
                        </p>
                        <p className="text-sm text-muted-foreground">Удалять серверы после приостановки</p>
                      </div>
                      <Switch
                        checked={pterodactylSettings.autoDelete}
                        onCheckedChange={(checked) => setPterodactylSettings({ ...pterodactylSettings, autoDelete: checked })}
                      />
                    </div>
                    {pterodactylSettings.autoDelete && (
                      <div className="space-y-2">
                        <Label>Удалять через (дней)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pterodactylSettings.deleteDays}
                          onChange={(e) => setPterodactylSettings({ ...pterodactylSettings, deleteDays: parseInt(e.target.value) || 7 })}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveSettings("pterodactyl", pterodactylSettings)} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={testPterodactyl}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Проверить соединение
                      {testResults.pterodactyl === "success" && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                      {testResults.pterodactyl === "error" && <X className="h-4 w-4 ml-2 text-red-500" />}
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/admin/pterodactyl")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Расширенные настройки
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Платёжные системы
                  </CardTitle>
                  <CardDescription>Интеграции с платёжными провайдерами</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { name: "YooKassa", status: "active", icon: "💳" },
                      { name: "FreeKassa", status: "inactive", icon: "💰" },
                      { name: "Криптовалюты", status: "inactive", icon: "₿" },
                    ].map((provider) => (
                      <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                              {provider.status === "active" ? "Активен" : "Не настроен"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/settings/payments")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Настроить платежи
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
