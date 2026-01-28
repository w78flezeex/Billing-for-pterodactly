"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  Loader2,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Wallet,
  Bitcoin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  User,
  Search,
  Filter,
  Settings,
} from "lucide-react"

interface WithdrawalRequest {
  id: string
  amount: number
  method: string
  details: Record<string, string>
  status: string
  adminNote?: string
  createdAt: string
  processedAt?: string
  user: {
    id: string
    name: string | null
    email: string
    balance: number
  }
}

interface Stats {
  pending: number
  processing: number
  totalPending: number
  completedToday: number
  completedAmount: number
}

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [tab, setTab] = useState("pending")
  const [search, setSearch] = useState("")

  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const [actionType, setActionType] = useState<"approve" | "reject" | "process">("approve")

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const statusFilter = tab === "pending" ? "PENDING" : tab === "processing" ? "PROCESSING" : ""
      const res = await fetch(`/api/admin/withdrawals?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error)
    } finally {
      setLoading(false)
    }
  }

  const openActionDialog = (request: WithdrawalRequest, action: "approve" | "reject" | "process") => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminNote(request.adminNote || "")
    setDialogOpen(true)
  }

  const processAction = async () => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const newStatus = actionType === "reject" ? "REJECTED" : 
                       actionType === "process" ? "PROCESSING" : "COMPLETED"

      const res = await fetch(`/api/admin/withdrawals/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote,
        }),
      })

      if (res.ok) {
        setDialogOpen(false)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка обработки")
      }
    } catch (error) {
      console.error("Process error:", error)
      alert("Ошибка обработки заявки")
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getMethodIcon = (m: string) => {
    switch (m) {
      case "CARD": return <CreditCard className="h-4 w-4" />
      case "YOOMONEY": return <Wallet className="h-4 w-4" />
      case "QIWI": return <Wallet className="h-4 w-4" />
      case "CRYPTO": return <Bitcoin className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getMethodLabel = (m: string) => {
    switch (m) {
      case "CARD": return "Банковская карта"
      case "YOOMONEY": return "ЮMoney"
      case "QIWI": return "QIWI"
      case "CRYPTO": return "Криптовалюта"
      default: return m
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>
      case "PROCESSING":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />В обработке</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Выполнено</Badge>
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Отклонено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDetails = (method: string, details: Record<string, string>) => {
    switch (method) {
      case "CARD":
        const card = details.cardNumber || ""
        return `•••• ${card.slice(-4)}`
      case "YOOMONEY":
        return details.wallet || ""
      case "QIWI":
        return details.phone || ""
      case "CRYPTO":
        return `${details.currency || "USDT"}: ${(details.address || "").slice(0, 10)}...`
      default:
        return JSON.stringify(details)
    }
  }

  const filteredRequests = requests.filter(r => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.user.email.toLowerCase().includes(searchLower) ||
      (r.user.name?.toLowerCase().includes(searchLower)) ||
      r.id.toLowerCase().includes(searchLower)
    )
  })

  if (loading && !requests.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowDownLeft className="h-8 w-8" />
            Заявки на вывод
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление заявками пользователей на вывод средств
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ожидают обработки</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">В обработке</p>
                  <p className="text-2xl font-bold">{stats.processing}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Сумма ожидания</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Выплачено сегодня</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.completedAmount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email, имени..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs & Table */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Ожидают {stats && stats.pending > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing">
            В обработке {stats && stats.processing > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.processing}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Все заявки</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Заявок не найдено</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Способ</TableHead>
                      <TableHead>Реквизиты</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{req.user.name || "—"}</p>
                            <p className="text-sm text-muted-foreground">{req.user.email}</p>
                            <p className="text-xs">Баланс: {formatCurrency(req.user.balance)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          {formatCurrency(req.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(req.method)}
                            <span>{getMethodLabel(req.method)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDetails(req.method, req.details)}
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {req.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(req, "process")}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                В обработку
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(req, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Выполнить
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionDialog(req, "reject")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Отклонить
                              </Button>
                            </>
                          )}
                          {req.status === "PROCESSING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(req, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Выполнить
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionDialog(req, "reject")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Отклонить
                              </Button>
                            </>
                          )}
                          {(req.status === "COMPLETED" || req.status === "REJECTED") && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Детали
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
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Выполнить вывод"}
              {actionType === "reject" && "Отклонить заявку"}
              {actionType === "process" && "Взять в обработку"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  Сумма: <strong>{formatCurrency(selectedRequest.amount)}</strong> — 
                  {getMethodLabel(selectedRequest.method)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="p-4 rounded-lg bg-muted">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Пользователь:</span>
                    <span>{selectedRequest.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Способ:</span>
                    <span className="flex items-center gap-1">
                      {getMethodIcon(selectedRequest.method)}
                      {getMethodLabel(selectedRequest.method)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Реквизиты:</span>
                    <span className="font-mono">
                      {selectedRequest.method === "CARD" && selectedRequest.details.cardNumber}
                      {selectedRequest.method === "YOOMONEY" && selectedRequest.details.wallet}
                      {selectedRequest.method === "QIWI" && selectedRequest.details.phone}
                      {selectedRequest.method === "CRYPTO" && (
                        <span>
                          {selectedRequest.details.currency}: {selectedRequest.details.address}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Note */}
              <div className="space-y-2">
                <Label>Комментарий администратора</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={actionType === "reject" ? "Причина отклонения..." : "Комментарий (необязательно)..."}
                  rows={3}
                />
              </div>

              {actionType === "approve" && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    После подтверждения средства будут списаны с баланса пользователя.
                  </p>
                </div>
              )}

              {actionType === "reject" && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Заявка будет отклонена, средства останутся на балансе пользователя.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={processAction}
              disabled={processing}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "approve" && "Подтвердить выплату"}
              {actionType === "reject" && "Отклонить"}
              {actionType === "process" && "Взять в обработку"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
