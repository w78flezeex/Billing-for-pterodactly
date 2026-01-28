"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Bot, 
  MessageCircle, 
  Loader2, 
  Save, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  RefreshCw,
  Send,
  Webhook,
  Mail,
  Shield
} from "lucide-react"

// Иконки Discord и Telegram
const DiscordIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
)

const TelegramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

interface IntegrationSetting {
  id: string
  key: string
  value: string
  isEncrypted: boolean
  description?: string
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [settings, setSettings] = useState<IntegrationSetting[]>([])
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Telegram
  const [telegramToken, setTelegramToken] = useState("")
  const [telegramBotUsername, setTelegramBotUsername] = useState("")
  const [telegramEnabled, setTelegramEnabled] = useState(false)

  // Discord
  const [discordClientId, setDiscordClientId] = useState("")
  const [discordClientSecret, setDiscordClientSecret] = useState("")
  const [discordBotToken, setDiscordBotToken] = useState("")
  const [discordGuildId, setDiscordGuildId] = useState("")
  const [discordEnabled, setDiscordEnabled] = useState(false)

  // SMTP
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [smtpFrom, setSmtpFrom] = useState("")
  const [smtpEnabled, setSmtpEnabled] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/integrations")
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
        // Заполняем значения
        data.settings.forEach((s: IntegrationSetting) => {
          switch (s.key) {
            case "telegram_bot_token": setTelegramToken(s.value); break
            case "telegram_bot_username": setTelegramBotUsername(s.value); break
            case "telegram_enabled": setTelegramEnabled(s.value === "true"); break
            case "discord_client_id": setDiscordClientId(s.value); break
            case "discord_client_secret": setDiscordClientSecret(s.value); break
            case "discord_bot_token": setDiscordBotToken(s.value); break
            case "discord_guild_id": setDiscordGuildId(s.value); break
            case "discord_enabled": setDiscordEnabled(s.value === "true"); break
            case "smtp_host": setSmtpHost(s.value); break
            case "smtp_port": setSmtpPort(s.value); break
            case "smtp_user": setSmtpUser(s.value); break
            case "smtp_pass": setSmtpPass(s.value); break
            case "smtp_from": setSmtpFrom(s.value); break
            case "smtp_enabled": setSmtpEnabled(s.value === "true"); break
          }
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Ошибка загрузки настроек")
    } finally {
      setLoading(false)
    }
  }

  const saveSetting = async (key: string, value: string, isEncrypted: boolean = false, description?: string) => {
    setSaving(key)
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, isEncrypted, description }),
      })
      
      if (res.ok) {
        toast.success("Настройка сохранена")
      } else {
        toast.error("Ошибка сохранения")
      }
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setSaving(null)
    }
  }

  const saveTelegramSettings = async () => {
    setSaving("telegram")
    try {
      await Promise.all([
        saveSetting("telegram_bot_token", telegramToken, true, "Токен Telegram бота"),
        saveSetting("telegram_bot_username", telegramBotUsername, false, "Username бота (без @)"),
        saveSetting("telegram_enabled", telegramEnabled.toString(), false, "Telegram интеграция включена"),
      ])
      toast.success("Настройки Telegram сохранены")
    } catch {
      toast.error("Ошибка сохранения")
    } finally {
      setSaving(null)
    }
  }

  const saveDiscordSettings = async () => {
    setSaving("discord")
    try {
      await Promise.all([
        saveSetting("discord_client_id", discordClientId, false, "Discord Client ID"),
        saveSetting("discord_client_secret", discordClientSecret, true, "Discord Client Secret"),
        saveSetting("discord_bot_token", discordBotToken, true, "Discord Bot Token"),
        saveSetting("discord_guild_id", discordGuildId, false, "Discord Server (Guild) ID"),
        saveSetting("discord_enabled", discordEnabled.toString(), false, "Discord интеграция включена"),
      ])
      toast.success("Настройки Discord сохранены")
    } catch {
      toast.error("Ошибка сохранения")
    } finally {
      setSaving(null)
    }
  }

  const saveSmtpSettings = async () => {
    setSaving("smtp")
    try {
      await Promise.all([
        saveSetting("smtp_host", smtpHost, false, "SMTP сервер"),
        saveSetting("smtp_port", smtpPort, false, "SMTP порт"),
        saveSetting("smtp_user", smtpUser, false, "SMTP пользователь"),
        saveSetting("smtp_pass", smtpPass, true, "SMTP пароль"),
        saveSetting("smtp_from", smtpFrom, false, "Email отправителя"),
        saveSetting("smtp_enabled", smtpEnabled.toString(), false, "SMTP включен"),
      ])
      toast.success("Настройки SMTP сохранены")
    } catch {
      toast.error("Ошибка сохранения")
    } finally {
      setSaving(null)
    }
  }

  const testTelegramBot = async () => {
    setSaving("telegram_test")
    try {
      const res = await fetch("/api/admin/integrations/test/telegram", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`Бот работает! @${data.username}`)
      } else {
        toast.error(data.error || "Ошибка подключения к боту")
      }
    } catch {
      toast.error("Ошибка тестирования")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Интеграции</h1>
        <p className="text-muted-foreground">
          Настройка внешних сервисов: Telegram, Discord, SMTP
        </p>
      </div>

      <Tabs defaultValue="telegram" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="telegram" className="gap-2">
            <TelegramIcon />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="discord" className="gap-2">
            <DiscordIcon />
            Discord
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" />
            SMTP
          </TabsTrigger>
        </TabsList>

        {/* Telegram */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#0088cc]/10 flex items-center justify-center">
                    <TelegramIcon />
                  </div>
                  <div>
                    <CardTitle>Telegram Bot</CardTitle>
                    <CardDescription>
                      Уведомления и управление через Telegram
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={telegramEnabled}
                    onCheckedChange={setTelegramEnabled}
                  />
                  <Badge variant={telegramEnabled ? "default" : "secondary"}>
                    {telegramEnabled ? "Включено" : "Выключено"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Bot Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="telegram-token"
                      type={showSecrets["telegram_token"] ? "text" : "password"}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSecrets(prev => ({ ...prev, telegram_token: !prev.telegram_token }))}
                    >
                      {showSecrets["telegram_token"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-username">Username бота</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="telegram-username"
                      placeholder="YourBotUsername"
                      value={telegramBotUsername}
                      onChange={(e) => setTelegramBotUsername(e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Функции бота</p>
                  <p className="text-sm text-muted-foreground">
                    Уведомления о платежах, серверах, тикетах. Проверка баланса.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testTelegramBot}
                    disabled={saving === "telegram_test" || !telegramToken}
                  >
                    {saving === "telegram_test" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Тест
                  </Button>
                  <Button
                    onClick={saveTelegramSettings}
                    disabled={saving === "telegram"}
                  >
                    {saving === "telegram" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Сохранить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discord */}
        <TabsContent value="discord">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                    <DiscordIcon />
                  </div>
                  <div>
                    <CardTitle>Discord OAuth & Bot</CardTitle>
                    <CardDescription>
                      Вход через Discord и уведомления
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={discordEnabled}
                    onCheckedChange={setDiscordEnabled}
                  />
                  <Badge variant={discordEnabled ? "default" : "secondary"}>
                    {discordEnabled ? "Включено" : "Выключено"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discord-client-id">Client ID</Label>
                  <Input
                    id="discord-client-id"
                    placeholder="123456789012345678"
                    value={discordClientId}
                    onChange={(e) => setDiscordClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord-client-secret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discord-client-secret"
                      type={showSecrets["discord_secret"] ? "text" : "password"}
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={discordClientSecret}
                      onChange={(e) => setDiscordClientSecret(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSecrets(prev => ({ ...prev, discord_secret: !prev.discord_secret }))}
                    >
                      {showSecrets["discord_secret"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord-bot-token">Bot Token (опционально)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discord-bot-token"
                      type={showSecrets["discord_token"] ? "text" : "password"}
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={discordBotToken}
                      onChange={(e) => setDiscordBotToken(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSecrets(prev => ({ ...prev, discord_token: !prev.discord_token }))}
                    >
                      {showSecrets["discord_token"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Для отправки уведомлений в канал
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord-guild-id">Server (Guild) ID</Label>
                  <Input
                    id="discord-guild-id"
                    placeholder="123456789012345678"
                    value={discordGuildId}
                    onChange={(e) => setDiscordGuildId(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium mb-2">Redirect URI для Discord</p>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/discord/callback
                </code>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveDiscordSettings}
                  disabled={saving === "discord"}
                >
                  {saving === "discord" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Email (SMTP)</CardTitle>
                    <CardDescription>
                      Отправка писем и рассылок
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={smtpEnabled}
                    onCheckedChange={setSmtpEnabled}
                  />
                  <Badge variant={smtpEnabled ? "default" : "secondary"}>
                    {smtpEnabled ? "Включено" : "Выключено"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Сервер</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Порт</Label>
                  <Input
                    id="smtp-port"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Пользователь</Label>
                  <Input
                    id="smtp-user"
                    placeholder="noreply@example.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Пароль</Label>
                  <div className="flex gap-2">
                    <Input
                      id="smtp-pass"
                      type={showSecrets["smtp_pass"] ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSecrets(prev => ({ ...prev, smtp_pass: !prev.smtp_pass }))}
                    >
                      {showSecrets["smtp_pass"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smtp-from">Email отправителя</Label>
                  <Input
                    id="smtp-from"
                    placeholder="HostingPanel <noreply@example.com>"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveSmtpSettings}
                  disabled={saving === "smtp"}
                >
                  {saving === "smtp" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
