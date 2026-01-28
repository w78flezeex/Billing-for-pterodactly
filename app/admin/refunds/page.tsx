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
  MoreHorizontal,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowDownLeft,
  User,
  Calendar,
} from "lucide-react"

interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description?: string
  paymentMethod?: string
  paymentId?: string
  status: string
  createdAt: string
  metadata?: Record<string, unknown>
  user: {
    id: string
    email: string
    name: string
  }
}

interface RefundStats {
  totalRefunds: number
  totalAmount: number
  pendingCount: number
  thisMonth: number
}

export default function RefundsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refundHistory, setRefundHistory] = useState<Transaction[]>([])
  const [stats, setStats] = useState<RefundStats | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tab, setTab] = useState("eligible")

  // Refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [page, tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        tab,
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/refunds?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (tab === "eligible") {
          setTransactions(data.transactions || [])
        } else {
          setRefundHistory(data.refunds || [])
        }
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error loading refunds:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadData()
  }

  const openRefundDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setRefundAmount(Math.abs(transaction.amount).toString())
    setRefundReason("")
    setRefundDialogOpen(true)
  }

  const processRefund = async () => {
    if (!selectedTransaction) return

    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Укажите корректную сумму")
      return
    }

    if (amount > Math.abs(selectedTransaction.amount)) {
      alert("Сумма возврата не может превышать сумму транзакции")
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          amount,
          reason: refundReason,
        }),
      })

      if (res.ok) {
        setRefundDialogOpen(false)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка возврата")
      }
    } catch (error) {
      console.error("Refund error:", error)
      alert("Ошибка обработки возврата")
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

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      DEPOSIT: { label: "Пополнение", variant: "default" },
      PURCHASE: { label: "Покупка", variant: "secondary" },
      REFUND: { label: "Возврат", variant: "destructive" },
      BONUS: { label: "Бонус", variant: "outline" },
      REFERRAL: { label: "Реферал", variant: "secondary" },
      PROMOCODE: { label: "Промокод", variant: "outline" },
    }
    const t = types[type] || { label: type, variant: "outline" }
    return <Badge variant={t.variant}>{t.label}</Badge>
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
            <h1 className="text-3xl font-bold">🔄 Управление возвратами</h1>
            <p className="text-muted-foreground">Возврат средств пользователям</p>
          </div>
        </div>
        <Button onClick={() => loadData()}>
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
                  <p className="text-sm text-muted-foreground">Всего возвратов</p>
                  <p className="text-2xl font-bold">{stats.totalRefunds}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Сумма возвратов</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ожидают обработки</p>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">За этот месяц</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500/30" />
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
                placeholder="Поиск по email или ID транзакции..."
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

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="eligible">📋 Доступные для возврата</TabsTrigger>
          <TabsTrigger value="history">📜 История возвратов</TabsTrigger>
        </TabsList>

        <TabsContent value="eligible" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Транзакции для возврата</CardTitle>
              <CardDescription>Покупки и пополнения, которые можно вернуть</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет транзакций для возврата
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("ru-RU")}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{tx.user.name || "—"}</div>
                              <div className="text-sm text-muted-foreground">{tx.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(tx.type)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Math.abs(tx.amount))}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRefundDialog(tx)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Возврат
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>История возвратов</CardTitle>
              <CardDescription>Все выполненные возвраты</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : refundHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  История возвратов пуста
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Исходная транзакция</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundHistory.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("ru-RU")}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tx.user.name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{tx.user.email}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          +{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(tx.metadata as { originalTransactionId?: string })?.originalTransactionId || "—"}
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

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оформить возврат</DialogTitle>
            <DialogDescription>
              Средства будут возвращены на баланс пользователя
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Пользователь:</span>
                  <span className="font-medium">{selectedTransaction.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Исходная сумма:</span>
                  <span className="font-medium">{formatCurrency(Math.abs(selectedTransaction.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата:</span>
                  <span>{new Date(selectedTransaction.createdAt).toLocaleString("ru-RU")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Сумма возврата</Label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={Math.abs(selectedTransaction.amount)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Можно вернуть частично (не более {formatCurrency(Math.abs(selectedTransaction.amount))})
                </p>
              </div>

              <div className="space-y-2">
                <Label>Причина возврата</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Укажите причину возврата..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Это действие необратимо. Средства будут зачислены на баланс пользователя.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={processRefund} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Оформить возврат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
