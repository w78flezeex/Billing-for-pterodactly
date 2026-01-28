"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { 
  Webhook, 
  Plus, 
  Loader2, 
  Trash2, 
  Copy, 
  Check,
  X,
  ExternalLink,
  Clock,
  AlertCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface WebhookLog {
  id: string
  event: string
  responseCode?: number
  success: boolean
  executedAt: string
}

interface WebhookData {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  failCount: number
  lastTriggeredAt?: string
  logs: WebhookLog[]
}

const WEBHOOK_EVENTS = [
  { value: "SERVER_CREATED", label: "Сервер создан" },
  { value: "SERVER_DELETED", label: "Сервер удалён" },
  { value: "SERVER_EXPIRED", label: "Сервер истёк" },
  { value: "SERVER_RENEWED", label: "Сервер продлён" },
  { value: "PAYMENT_COMPLETED", label: "Платёж завершён" },
  { value: "PAYMENT_FAILED", label: "Платёж неудачен" },
  { value: "BALANCE_LOW", label: "Низкий баланс" },
  { value: "TICKET_CREATED", label: "Тикет создан" },
  { value: "TICKET_REPLIED", label: "Ответ в тикете" },
]

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks")
      const data = await res.json()
      if (data.webhooks) setWebhooks(data.webhooks)
    } catch (error) {
      console.error("Error fetching webhooks:", error)
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  const createWebhook = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Заполните все поля")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, events: selectedEvents }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Ошибка создания")
        return
      }

      toast.success("Webhook создан")
      setDialogOpen(false)
      setName("")
      setUrl("")
      setSelectedEvents([])
      fetchWebhooks()
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setSaving(false)
    }
  }

  const toggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      })

      if (res.ok) {
        setWebhooks(prev => 
          prev.map(w => w.id === id ? { ...w, isActive } : w)
        )
        toast.success(isActive ? "Webhook включён" : "Webhook отключён")
      }
    } catch {
      toast.error("Ошибка обновления")
    }
  }

  const deleteWebhook = async (id: string) => {
    try {
      const res = await fetch("/api/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== id))
        toast.success("Webhook удалён")
      }
    } catch {
      toast.error("Ошибка удаления")
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    toast.success("Секрет скопирован")
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("ru-RU")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Webhook className="h-8 w-8 text-primary" />
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-2">
            Получайте уведомления о событиях в ваших приложениях
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый Webhook</DialogTitle>
              <DialogDescription>
                Webhook будет вызываться при выбранных событиях
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  placeholder="Мой сервер"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>События</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={selectedEvents.includes(event.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents(prev => [...prev, event.value])
                          } else {
                            setSelectedEvents(prev => prev.filter(e => e !== event.value))
                          }
                        }}
                      />
                      <label
                        htmlFor={event.value}
                        className="text-sm cursor-pointer"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={createWebhook} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет webhooks</h3>
            <p className="text-muted-foreground text-center mb-4">
              Создайте webhook для получения уведомлений о событиях
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      webhook.isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    }`}>
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {webhook.url.length > 40 
                          ? webhook.url.slice(0, 40) + "..." 
                          : webhook.url
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {webhook.failCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {webhook.failCount} ошибок
                      </Badge>
                    )}
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* События */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">События:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => {
                        const eventInfo = WEBHOOK_EVENTS.find(e => e.value === event)
                        return (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {eventInfo?.label || event}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {/* Секрет */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Signing Secret</p>
                        <code className="text-xs text-muted-foreground">
                          {webhook.secret.slice(0, 8)}...{webhook.secret.slice(-8)}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copySecret(webhook.secret)}
                      >
                        {copiedSecret === webhook.secret ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Логи */}
                  {webhook.logs.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="logs" className="border-none">
                        <AccordionTrigger className="text-sm py-2">
                          Последние вызовы
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {webhook.logs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {log.success ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-destructive" />
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {WEBHOOK_EVENTS.find(e => e.value === log.event)?.label || log.event}
                                  </Badge>
                                  {log.responseCode && (
                                    <span className="text-muted-foreground">
                                      HTTP {log.responseCode}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(log.executedAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Документация */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Как использовать</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Формат запроса</h4>
            <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`POST your-webhook-url
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256>
X-Webhook-Event: <event-type>

{
  "event": "PAYMENT_COMPLETED",
  "timestamp": "2026-01-28T12:00:00Z",
  "data": {
    "amount": 500,
    "userId": "abc123"
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Проверка подписи</h4>
            <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const expected = crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(payload)
  .digest('hex');

if (signature === expected) {
  // Подпись верна
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
