"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Loader2,
  Search,
  RefreshCw,
  Gift,
  Plus,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Mail,
  Calendar,
  User,
  Trash2,
} from "lucide-react"

interface GiftCertificate {
  id: string
  code: string
  amount: number
  balance: number
  purchasedById?: string
  purchasedBy?: { email: string; name?: string }
  redeemedById?: string
  redeemedBy?: { email: string; name?: string }
  redeemedAt?: string
  expiresAt?: string
  isActive: boolean
  message?: string
  recipientEmail?: string
  createdAt: string
}

interface Stats {
  totalCertificates: number
  totalValue: number
  activeCount: number
  redeemedCount: number
}

export default function GiftCertificatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<GiftCertificate[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAmount, setNewAmount] = useState("500")
  const [newMessage, setNewMessage] = useState("")
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [newExpiresAt, setNewExpiresAt] = useState("")
  const [creating, setCreating] = useState(false)

  // Created certificate
  const [createdCertificate, setCreatedCertificate] = useState<GiftCertificate | null>(null)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/gift-certificates?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCertificates(data.certificates || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error loading certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadData()
  }

  const createCertificate = async () => {
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount < 100) {
      alert("Минимальная сумма: 100 ₽")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/gift-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          message: newMessage || undefined,
          recipientEmail: newRecipientEmail || undefined,
          expiresAt: newExpiresAt || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedCertificate(data.certificate)
        setCreateDialogOpen(false)
        loadData()
        // Reset form
        setNewAmount("500")
        setNewMessage("")
        setNewRecipientEmail("")
        setNewExpiresAt("")
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка создания")
      }
    } catch (error) {
      console.error("Create error:", error)
      alert("Ошибка создания сертификата")
    } finally {
      setCreating(false)
    }
  }

  const deactivateCertificate = async (id: string) => {
    if (!confirm("Деактивировать сертификат?")) return

    try {
      const res = await fetch(`/api/admin/gift-certificates/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка")
      }
    } catch (error) {
      console.error("Deactivate error:", error)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (cert: GiftCertificate) => {
    if (!cert.isActive) {
      return <Badge variant="secondary">Деактивирован</Badge>
    }
    if (cert.redeemedAt) {
      if (cert.balance === 0) {
        return <Badge variant="outline">Использован</Badge>
      }
      return <Badge variant="default">Частично использован</Badge>
    }
    if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) {
      return <Badge variant="destructive">Истёк</Badge>
    }
    return <Badge className="bg-green-500">Активен</Badge>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🎁 Подарочные сертификаты</h1>
            <p className="text-muted-foreground">Создание и управление сертификатами</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать сертификат
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего сертификатов</p>
                  <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                </div>
                <Gift className="h-8 w-8 text-purple-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Общая стоимость</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активных</p>
                  <p className="text-2xl font-bold">{stats.activeCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активировано</p>
                  <p className="text-2xl font-bold">{stats.redeemedCount}</p>
                </div>
                <User className="h-8 w-8 text-orange-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по коду или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Найти
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список сертификатов</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Сертификаты не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Номинал</TableHead>
                  <TableHead>Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Покупатель</TableHead>
                  <TableHead>Использовал</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                          {cert.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(cert.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cert.amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(cert.balance)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cert)}
                    </TableCell>
                    <TableCell>
                      {cert.purchasedBy ? (
                        <div className="text-sm">
                          <div>{cert.purchasedBy.name || "—"}</div>
                          <div className="text-muted-foreground">{cert.purchasedBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Админ</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cert.redeemedBy ? (
                        <div className="text-sm">
                          <div>{cert.redeemedBy.name || "—"}</div>
                          <div className="text-muted-foreground">{cert.redeemedBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {cert.expiresAt ? (
                        <div className="text-sm">
                          {new Date(cert.expiresAt).toLocaleDateString("ru-RU")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Бессрочный</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {cert.isActive && !cert.redeemedAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivateCertificate(cert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Назад
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Вперёд
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать подарочный сертификат</DialogTitle>
            <DialogDescription>
              Сертификат можно отправить получателю по email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Номинал (₽) *</Label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min={100}
                step={100}
              />
              <p className="text-xs text-muted-foreground">Минимум 100 ₽</p>
            </div>

            <div className="space-y-2">
              <Label>Email получателя</Label>
              <Input
                type="email"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Если указан, сертификат будет отправлен на email
              </p>
            </div>

            <div className="space-y-2">
              <Label>Срок действия</Label>
              <Input
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для бессрочного сертификата
              </p>
            </div>

            <div className="space-y-2">
              <Label>Сообщение получателю</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Поздравляем с праздником!"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={createCertificate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created Certificate Dialog */}
      <Dialog open={!!createdCertificate} onOpenChange={() => setCreatedCertificate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Сертификат создан!
            </DialogTitle>
          </DialogHeader>

          {createdCertificate && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <p className="text-sm text-muted-foreground mb-2">Код сертификата:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="font-mono text-2xl font-bold">
                    {createdCertificate.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyCode(createdCertificate.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-4 text-xl font-bold">
                  {formatCurrency(createdCertificate.amount)}
                </p>
              </div>

              {createdCertificate.recipientEmail && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">
                    Сертификат отправлен на: <strong>{createdCertificate.recipientEmail}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedCertificate(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
