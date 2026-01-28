"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Loader2,
  Search,
  RefreshCw,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Globe,
  Activity,
} from "lucide-react"

interface FraudAlert {
  id: string
  userId: string
  user: {
    email: string
    name?: string
  }
  type: string
  severity: string
  description: string
  metadata?: Record<string, unknown>
  status: string
  reviewedById?: string
  reviewedAt?: string
  reviewNote?: string
  createdAt: string
}

interface FraudStats {
  totalAlerts: number
  pending: number
  investigating: number
  confirmed: number
  resolved: number
  bySeverity: Record<string, number>
}

export default function FraudDetectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [stats, setStats] = useState<FraudStats | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [reviewStatus, setReviewStatus] = useState("")
  const [reviewNote, setReviewNote] = useState("")
  const [processing, setProcessing] = useState(false)

  // Scan dialog
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ newAlerts: number } | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [page, filterStatus, filterSeverity])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterSeverity !== "all" && { severity: filterSeverity }),
      })

      const res = await fetch(`/api/admin/fraud?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error loading alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const runScan = async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/admin/fraud/scan", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setScanResult(data)
        loadAlerts()
      }
    } catch (error) {
      console.error("Scan error:", error)
    } finally {
      setScanning(false)
    }
  }

  const openReviewDialog = (alert: FraudAlert) => {
    setSelectedAlert(alert)
    setReviewStatus(alert.status)
    setReviewNote("")
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!selectedAlert) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/fraud/${selectedAlert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          note: reviewNote,
        }),
      })

      if (res.ok) {
        setReviewDialogOpen(false)
        loadAlerts()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка")
      }
    } catch (error) {
      console.error("Review error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive">🔴 Критический</Badge>
      case "HIGH":
        return <Badge className="bg-orange-500">🟠 Высокий</Badge>
      case "MEDIUM":
        return <Badge className="bg-yellow-500">🟡 Средний</Badge>
      case "LOW":
        return <Badge variant="secondary">⚪ Низкий</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>
      case "INVESTIGATING":
        return <Badge className="bg-blue-500"><Activity className="h-3 w-3 mr-1" />Расследуется</Badge>
      case "CONFIRMED":
        return <Badge variant="destructive"><ShieldX className="h-3 w-3 mr-1" />Подтверждено</Badge>
      case "FALSE_POSITIVE":
        return <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1" />Ложное</Badge>
      case "RESOLVED":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Решено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_ACCOUNTS":
        return <User className="h-4 w-4" />
      case "SUSPICIOUS_PAYMENT":
        return <CreditCard className="h-4 w-4" />
      case "IP_MISMATCH":
        return <Globe className="h-4 w-4" />
      case "VELOCITY":
        return <Activity className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const typeLabels: Record<string, string> = {
    MULTIPLE_ACCOUNTS: "Множественные аккаунты",
    SUSPICIOUS_PAYMENT: "Подозрительный платёж",
    UNUSUAL_ACTIVITY: "Необычная активность",
    CHARGEBACK: "Чарджбэк",
    IP_MISMATCH: "Несоответствие IP",
    VELOCITY: "Слишком много транзакций",
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
            <h1 className="text-3xl font-bold">🛡️ Детектор мошенничества</h1>
            <p className="text-muted-foreground">Мониторинг подозрительной активности</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadAlerts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={runScan} disabled={scanning}>
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Запустить сканирование
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего алертов</p>
                  <p className="text-2xl font-bold">{stats.totalAlerts}</p>
                </div>
                <ShieldAlert className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ожидают</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">В расследовании</p>
                  <p className="text-2xl font-bold">{stats.investigating}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Подтверждено</p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                </div>
                <ShieldX className="h-8 w-8 text-red-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Решено</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan result notification */}
      {scanResult && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Сканирование завершено. Найдено новых алертов: <strong>{scanResult.newAlerts}</strong></span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setScanResult(null)}>
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="PENDING">Ожидают</SelectItem>
                <SelectItem value="INVESTIGATING">В расследовании</SelectItem>
                <SelectItem value="CONFIRMED">Подтверждено</SelectItem>
                <SelectItem value="FALSE_POSITIVE">Ложное срабатывание</SelectItem>
                <SelectItem value="RESOLVED">Решено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Серьёзность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="CRITICAL">Критический</SelectItem>
                <SelectItem value="HIGH">Высокий</SelectItem>
                <SelectItem value="MEDIUM">Средний</SelectItem>
                <SelectItem value="LOW">Низкий</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Алерты безопасности</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Подозрительная активность не обнаружена</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Серьёзность</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleDateString("ru-RU")}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <span className="text-sm">{typeLabels[alert.type] || alert.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{alert.user.name || "—"}</div>
                        <div className="text-sm text-muted-foreground">{alert.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {alert.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReviewDialog(alert)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Просмотреть
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/users?id=${alert.userId}`)}>
                            <User className="h-4 w-4 mr-2" />
                            Профиль пользователя
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Просмотр алерта</DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Тип</Label>
                  <p className="font-medium">{typeLabels[selectedAlert.type] || selectedAlert.type}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Серьёзность</Label>
                  <p>{getSeverityBadge(selectedAlert.severity)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Пользователь</Label>
                  <p className="font-medium">{selectedAlert.user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Дата</Label>
                  <p>{new Date(selectedAlert.createdAt).toLocaleString("ru-RU")}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Описание</Label>
                <p className="p-3 bg-muted rounded-lg">{selectedAlert.description}</p>
              </div>

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Дополнительные данные</Label>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <Label>Изменить статус</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Ожидает</SelectItem>
                    <SelectItem value="INVESTIGATING">В расследовании</SelectItem>
                    <SelectItem value="CONFIRMED">Подтверждено (мошенничество)</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">Ложное срабатывание</SelectItem>
                    <SelectItem value="RESOLVED">Решено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Заметка</Label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Добавьте заметку о результатах проверки..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitReview} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
