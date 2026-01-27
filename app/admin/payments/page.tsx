"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  FileText,
  RefreshCw,
  CreditCard,
  TrendingUp,
  DollarSign,
  ExternalLink,
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
  user: {
    id: string
    email: string
    name: string
  }
}

interface Stats {
  totalAmount: number
  totalCount: number
  deposits: number
  purchases: number
}

export default function PaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Action dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [page, filterType, filterStatus])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      })

      const res = await fetch(`/api/admin/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadTransactions()
  }

  const openActionDialog = (transaction: Transaction, action: "approve" | "reject") => {
    setSelectedTransaction(transaction)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const processAction = async () => {
    if (!selectedTransaction || !actionType) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      })

      if (res.ok) {
        const data = await res.json()
        setActionDialogOpen(false)
        await loadTransactions()

        if (data.receiptUrl) {
          // Показываем ссылку на чек
          alert(`Платёж подтверждён! Чек доступен по ссылке: ${window.location.origin}${data.receiptUrl}`)
        }
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка")
      }
    } catch (error) {
      console.error("Error processing action:", error)
      alert("Ошибка обработки")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Выполнено</Badge>
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ошибка</Badge>
      case "CANCELLED":
        return <Badge variant="outline">Отменено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      DEPOSIT: { label: "Пополнение", variant: "default" },
      PURCHASE: { label: "Покупка", variant: "secondary" },
      REFUND: { label: "Возврат", variant: "outline" },
      BONUS: { label: "Бонус", variant: "default" },
      REFERRAL: { label: "Реферал", variant: "secondary" },
    }
    const t = types[type] || { label: type, variant: "outline" }
    return <Badge variant={t.variant}>{t.label}</Badge>
  }

  // Фильтруем только ожидающие подтверждения
  const pendingTransactions = transactions.filter(t => t.status === "PENDING")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Платежи</h1>
              <p className="text-muted-foreground">Управление транзакциями и подтверждение платежей</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.deposits.toFixed(0)} ₽</p>
                    <p className="text-sm text-muted-foreground">Пополнения</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.purchases.toFixed(0)} ₽</p>
                    <p className="text-sm text-muted-foreground">Покупки</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCount}</p>
                    <p className="text-sm text-muted-foreground">Всего транзакций</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingTransactions.length}</p>
                    <p className="text-sm text-muted-foreground">Ожидают подтверждения</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue={pendingTransactions.length > 0 ? "pending" : "all"}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Ожидают подтверждения
              {pendingTransactions.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingTransactions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Все транзакции</TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Платежи ожидающие подтверждения</CardTitle>
                <CardDescription>
                  Проверьте поступление средств и подтвердите или отклоните платежи
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Нет платежей ожидающих подтверждения</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Способ</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">
                            {tx.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.user.name}</p>
                              <p className="text-sm text-muted-foreground">{tx.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-green-500">
                            +{tx.amount} ₽
                          </TableCell>
                          <TableCell>{tx.paymentMethod || "-"}</TableCell>
                          <TableCell>
                            {new Date(tx.createdAt).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(tx, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Подтвердить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(tx, "reject")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Отклонить
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Все транзакции</CardTitle>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-[200px]"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="DEPOSIT">Пополнения</SelectItem>
                        <SelectItem value="PURCHASE">Покупки</SelectItem>
                        <SelectItem value="REFUND">Возвраты</SelectItem>
                        <SelectItem value="BONUS">Бонусы</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="COMPLETED">Выполнено</SelectItem>
                        <SelectItem value="PENDING">Ожидает</SelectItem>
                        <SelectItem value="FAILED">Ошибка</SelectItem>
                      </SelectContent>
                    </Select>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">Нет транзакций</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Сумма</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-xs">
                              {tx.id.slice(-8)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{tx.user.name}</p>
                                <p className="text-sm text-muted-foreground">{tx.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(tx.type)}</TableCell>
                            <TableCell className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount} ₽
                            </TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell>
                              {new Date(tx.createdAt).toLocaleDateString("ru-RU")}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {tx.status === "COMPLETED" && (
                                    <DropdownMenuItem
                                      onClick={() => window.open(`/api/billing/receipt/${tx.id}`, "_blank")}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Открыть чек
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/users/${tx.userId}`)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Профиль пользователя
                                  </DropdownMenuItem>
                                  {tx.status === "PENDING" && (
                                    <>
                                      <DropdownMenuItem onClick={() => openActionDialog(tx, "approve")}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Подтвердить
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openActionDialog(tx, "reject")}>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Отклонить
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          Назад
                        </Button>
                        <span className="flex items-center px-4 text-sm">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === totalPages}
                          onClick={() => setPage(p => p + 1)}
                        >
                          Вперёд
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Подтвердить платёж" : "Отклонить платёж"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Баланс пользователя будет пополнен на указанную сумму. Будет сгенерирован чек."
                  : "Платёж будет отклонён. Пользователь получит уведомление."}
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Пользователь:</span>
                    <span className="font-medium">{selectedTransaction.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedTransaction.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сумма:</span>
                    <span className="font-bold text-green-500">+{selectedTransaction.amount} ₽</span>
                  </div>
                  {selectedTransaction.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Способ оплаты:</span>
                      <span>{selectedTransaction.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={processAction}
                disabled={processing}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === "approve" ? "Подтвердить" : "Отклонить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
