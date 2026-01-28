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
import { Checkbox } from "@/components/ui/checkbox"
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
  ArrowLeft,
  Loader2,
  Search,
  RefreshCw,
  Gift,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Send,
  Filter,
  UserCheck,
  Coins,
} from "lucide-react"

interface User {
  id: string
  email: string
  name?: string
  balance: number
  createdAt: string
  lastLoginAt?: string
  _count?: {
    servers: number
    transactions: number
  }
}

interface BonusHistory {
  id: string
  amount: number
  reason: string
  userCount: number
  totalAmount: number
  createdAt: string
  adminEmail: string
}

export default function MassBonusesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [history, setHistory] = useState<BonusHistory[]>([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Bonus dialog
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
  const [bonusAmount, setBonusAmount] = useState("100")
  const [bonusReason, setBonusReason] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Result dialog
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [bonusResult, setBonusResult] = useState<{
    success: number
    failed: number
    totalAmount: number
  } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [page, filterType])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(filterType !== "all" && { filter: filterType }),
      })

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalUsers(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/admin/mass-bonus/history")
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
    setSelectAll(!selectAll)
  }

  const selectByFilter = async (filter: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?limit=1000&filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedUsers(new Set(data.users.map((u: User) => u.id)))
      }
    } catch (error) {
      console.error("Error selecting users:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendBonus = async () => {
    if (selectedUsers.size === 0) {
      alert("Выберите пользователей")
      return
    }

    const amount = parseFloat(bonusAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Укажите корректную сумму")
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/admin/mass-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          amount,
          reason: bonusReason || "Бонус от администратора",
          sendEmail,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBonusResult(data)
        setBonusDialogOpen(false)
        setResultDialogOpen(true)
        setSelectedUsers(new Set())
        loadUsers()
        loadHistory()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка отправки бонусов")
      }
    } catch (error) {
      console.error("Bonus error:", error)
      alert("Ошибка отправки")
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🎁 Массовые бонусы</h1>
            <p className="text-muted-foreground">Начисление бонусов группе пользователей</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button
            onClick={() => setBonusDialogOpen(true)}
            disabled={selectedUsers.size === 0}
          >
            <Gift className="h-4 w-4 mr-2" />
            Начислить бонус ({selectedUsers.size})
          </Button>
        </div>
      </div>

      {/* Quick Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Быстрый выбор пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => selectByFilter("active")}>
              <UserCheck className="h-4 w-4 mr-1" />
              Активные за 30 дней
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectByFilter("with-servers")}>
              Имеют серверы
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectByFilter("new")}>
              Новые за неделю
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectByFilter("paid")}>
              С пополнениями
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedUsers(new Set())}>
              Очистить выбор
            </Button>
          </div>
          {selectedUsers.size > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
              <span>
                Выбрано: <strong>{selectedUsers.size}</strong> пользователей
              </span>
              <span className="text-muted-foreground">
                Общая сумма: <strong>{formatCurrency(selectedUsers.size * parseFloat(bonusAmount || "0"))}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">👥 Пользователи</TabsTrigger>
          <TabsTrigger value="history">📜 История бонусов</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по email или имени..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Фильтр" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все пользователи</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="with-servers">С серверами</SelectItem>
                    <SelectItem value="new">Новые</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Найти
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Список пользователей</CardTitle>
                <span className="text-sm text-muted-foreground">
                  Всего: {totalUsers}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Баланс</TableHead>
                      <TableHead>Серверов</TableHead>
                      <TableHead>Последний вход</TableHead>
                      <TableHead>Регистрация</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className={selectedUsers.has(user.id) ? "bg-primary/5" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name || "—"}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(user.balance)}
                        </TableCell>
                        <TableCell>
                          {user._count?.servers || 0}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString("ru-RU")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("ru-RU")}
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
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>История массовых начислений</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>История начислений пуста</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма на пользователя</TableHead>
                      <TableHead>Пользователей</TableHead>
                      <TableHead>Общая сумма</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Администратор</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.userCount}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.adminEmail}
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

      {/* Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Начислить бонус</DialogTitle>
            <DialogDescription>
              Выбрано пользователей: {selectedUsers.size}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Сумма бонуса (₽) *</Label>
              <Input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Общая сумма: {formatCurrency(selectedUsers.size * parseFloat(bonusAmount || "0"))}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Причина начисления</Label>
              <Textarea
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                placeholder="Бонус за участие в акции, компенсация и т.д."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail">
                Отправить уведомление на email
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={sendBonus} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Начислить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Бонусы начислены!
            </DialogTitle>
          </DialogHeader>

          {bonusResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{bonusResult.success}</div>
                  <div className="text-sm text-muted-foreground">Успешно</div>
                </div>
                {bonusResult.failed > 0 && (
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{bonusResult.failed}</div>
                    <div className="text-sm text-muted-foreground">Ошибок</div>
                  </div>
                )}
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(bonusResult.totalAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Начислено</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
