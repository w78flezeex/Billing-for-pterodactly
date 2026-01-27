"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  Server,
  MessageSquare,
  Shield,
  Ban,
  Trash2,
  Plus,
  Minus,
  Save,
  RefreshCw,
  Activity,
} from "lucide-react"

interface UserData {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  company?: string
  role: string
  balance: number
  emailVerified: boolean
  twoFactorEnabled: boolean
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  servers: Array<{
    id: string
    name: string
    status: string
    plan: { name: string }
    expiresAt: string
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    status: string
    createdAt: string
  }>
  tickets: Array<{
    id: string
    subject: string
    status: string
    createdAt: string
  }>
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [error, setError] = useState("")

  // Edit state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Balance dialog
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)
  const [balanceAction, setBalanceAction] = useState<"add" | "subtract">("add")
  const [balanceAmount, setBalanceAmount] = useState("")
  const [balanceReason, setBalanceReason] = useState("")

  useEffect(() => {
    loadUser()
  }, [userId])

  const loadUser = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error("Пользователь не найден")
      const data = await res.json()
      setUser(data.user)
      setName(data.user.name)
      setEmail(data.user.email)
      setPhone(data.user.phone || "")
      setCompany(data.user.company || "")
      setRole(data.user.role)
      setIsActive(data.user.isActive)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, role, isActive }),
      })
      if (!res.ok) throw new Error("Ошибка сохранения")
      await loadUser()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBalanceChange = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: balanceAction,
          amount: parseFloat(balanceAmount),
          reason: balanceReason,
        }),
      })
      if (!res.ok) throw new Error("Ошибка изменения баланса")
      setBalanceDialogOpen(false)
      setBalanceAmount("")
      setBalanceReason("")
      await loadUser()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleBan = async () => {
    if (!confirm(`Вы уверены, что хотите ${isActive ? "заблокировать" : "разблокировать"} пользователя?`)) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error("Ошибка")
      await loadUser()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      SUSPENDED: "destructive",
      EXPIRED: "outline",
      COMPLETED: "default",
      FAILED: "destructive",
      OPEN: "default",
      CLOSED: "secondary",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Пользователь не найден"}</p>
            <Button onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
            {!user.isActive && <Badge variant="destructive">Заблокирован</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadUser}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleBan}
            >
              <Ban className="h-4 w-4 mr-2" />
              {isActive ? "Заблокировать" : "Разблокировать"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info">
              <TabsList className="mb-4">
                <TabsTrigger value="info">Информация</TabsTrigger>
                <TabsTrigger value="servers">Серверы ({user.servers.length})</TabsTrigger>
                <TabsTrigger value="transactions">Транзакции ({user.transactions.length})</TabsTrigger>
                <TabsTrigger value="tickets">Тикеты ({user.tickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Редактирование профиля</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Имя</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Телефон</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Компания</Label>
                        <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Роль</Label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Пользователь</SelectItem>
                            <SelectItem value="MODERATOR">Модератор</SelectItem>
                            <SelectItem value="ADMIN">Администратор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Статус</Label>
                        <div className="flex items-center gap-2 h-10">
                          <Switch checked={isActive} onCheckedChange={setIsActive} />
                          <span>{isActive ? "Активен" : "Заблокирован"}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Сохранить
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="servers">
                <Card>
                  <CardHeader>
                    <CardTitle>Серверы пользователя</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.servers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Нет серверов</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Название</TableHead>
                            <TableHead>Тариф</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Истекает</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.servers.map((server) => (
                            <TableRow key={server.id}>
                              <TableCell className="font-medium">{server.name}</TableCell>
                              <TableCell>{server.plan.name}</TableCell>
                              <TableCell>{getStatusBadge(server.status)}</TableCell>
                              <TableCell>{new Date(server.expiresAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>История транзакций</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.transactions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Нет транзакций</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Тип</TableHead>
                            <TableHead>Сумма</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.type}</TableCell>
                              <TableCell className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount} ₽
                              </TableCell>
                              <TableCell>{getStatusBadge(tx.status)}</TableCell>
                              <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle>Тикеты поддержки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.tickets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Нет тикетов</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Тема</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.subject}</TableCell>
                              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                              <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Баланс
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">{user.balance.toFixed(2)} ₽</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setBalanceAction("add")
                      setBalanceDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Пополнить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBalanceAction("subtract")
                      setBalanceDialogOpen(true)
                    }}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Списать
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardHeader>
                <CardTitle>Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email верифицирован:</span>
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Да" : "Нет"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">2FA:</span>
                  <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                    {user.twoFactorEnabled ? "Включена" : "Выключена"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Регистрация:</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Последний вход:</span>
                  <span>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : "Никогда"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Activity summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Активность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Серверов
                  </span>
                  <Badge variant="outline">{user.servers.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Транзакций
                  </span>
                  <Badge variant="outline">{user.transactions.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Тикетов
                  </span>
                  <Badge variant="outline">{user.tickets.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Balance Dialog */}
        <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {balanceAction === "add" ? "Пополнить баланс" : "Списать с баланса"}
              </DialogTitle>
              <DialogDescription>
                Текущий баланс: {user.balance.toFixed(2)} ₽
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Сумма</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Причина</Label>
                <Input
                  placeholder="Причина изменения баланса"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleBalanceChange}>
                {balanceAction === "add" ? "Пополнить" : "Списать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
