"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mail, 
  Plus, 
  Loader2, 
  Trash2, 
  Send,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Users
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Campaign {
  id: string
  name: string
  subject: string
  content: string
  targetType: string
  sentCount: number
  openCount: number
  clickCount: number
  status: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

const TARGET_TYPES = [
  { value: "ALL_USERS", label: "Все пользователи" },
  { value: "ACTIVE_USERS", label: "Активные (30 дней)" },
  { value: "INACTIVE_USERS", label: "Неактивные (30+ дней)" },
  { value: "WITH_SERVERS", label: "С серверами" },
  { value: "WITHOUT_SERVERS", label: "Без серверов" },
]

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [targetType, setTargetType] = useState("ALL_USERS")

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/campaigns")
      const data = await res.json()
      if (data.campaigns) setCampaigns(data.campaigns)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setName(campaign.name)
      setSubject(campaign.subject)
      setContent(campaign.content)
      setTargetType(campaign.targetType)
    } else {
      setEditingCampaign(null)
      setName("")
      setSubject("")
      setContent("")
      setTargetType("ALL_USERS")
    }
    setDialogOpen(true)
  }

  const saveCampaign = async () => {
    if (!name || !subject || !content) {
      toast.error("Заполните все поля")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: editingCampaign ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCampaign?.id,
          name,
          subject,
          content,
          targetType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Ошибка сохранения")
        return
      }

      toast.success(editingCampaign ? "Кампания обновлена" : "Кампания создана")
      setDialogOpen(false)
      fetchCampaigns()
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setSaving(false)
    }
  }

  const sendCampaign = async (id: string) => {
    setSending(id)
    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Ошибка отправки")
        return
      }

      toast.success(`Отправлено ${data.sentCount} из ${data.totalRecipients} писем`)
      fetchCampaigns()
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setSending(null)
    }
  }

  const deleteCampaign = async (id: string) => {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id))
        toast.success("Кампания удалена")
      } else {
        const data = await res.json()
        toast.error(data.error || "Ошибка удаления")
      }
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary"><Edit className="h-3 w-3 mr-1" />Черновик</Badge>
      case "SCHEDULED":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Запланирована</Badge>
      case "SENDING":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Отправляется</Badge>
      case "SENT":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Отправлена</Badge>
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Отменена</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email рассылки</h1>
          <p className="text-muted-foreground">
            Создавайте и отправляйте рассылки пользователям
          </p>
        </div>

        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Создать кампанию
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет кампаний</h3>
            <p className="text-muted-foreground text-center mb-4">
              Создайте первую email кампанию для рассылки
            </p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Создать кампанию
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle>{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription className="mt-1">
                      Тема: {campaign.subject}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === "DRAFT" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(campaign)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => sendCampaign(campaign.id)}
                          disabled={sending === campaign.id}
                        >
                          {sending === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Отправить
                        </Button>
                      </>
                    )}
                    {campaign.status !== "SENDING" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{TARGET_TYPES.find(t => t.value === campaign.targetType)?.label}</span>
                  </div>
                  {campaign.status === "SENT" && (
                    <>
                      <div>
                        <span className="font-medium text-foreground">{campaign.sentCount}</span> отправлено
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{campaign.openCount}</span> открыто
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{campaign.clickCount}</span> кликов
                      </div>
                    </>
                  )}
                  <div className="ml-auto">
                    {campaign.sentAt ? (
                      <span>Отправлено: {formatDate(campaign.sentAt)}</span>
                    ) : (
                      <span>Создано: {formatDate(campaign.createdAt)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания/редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Редактировать кампанию" : "Новая кампания"}
            </DialogTitle>
            <DialogDescription>
              Создайте email рассылку для пользователей
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название кампании</Label>
                <Input
                  id="name"
                  placeholder="Новогодняя акция"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Аудитория</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Тема письма</Label>
              <Input
                id="subject"
                placeholder="🎁 Специальное предложение для вас!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Содержимое (HTML)</Label>
              <Textarea
                id="content"
                placeholder="<h1>Привет, {{name}}!</h1><p>У нас для вас отличные новости...</p>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Используйте {"{{name}}"} для подстановки имени пользователя
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveCampaign} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingCampaign ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить кампанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteCampaign(deleteConfirm)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
