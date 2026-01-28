"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Server,
  User,
  Settings,
  CreditCard,
  LogOut,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Building,
  Calendar,
  Wallet,
  Shield,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Save,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

interface ProfileServer {
  id: string
  name: string
  status: string
  expiresAt: string
  plan: {
    name: string
    type: string
  }
}

interface ProfileOrder {
  id: string
  amount: number
  status: string
  createdAt: string
  plan: {
    name: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, logout, refreshUser } = useAuth()
  
  const [servers, setServers] = useState<ProfileServer[]>([])
  const [orders, setOrders] = useState<ProfileOrder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Form states
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setPhone(user.phone || "")
      setCompany(user.company || "")
    }
  }, [user])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return
      
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          setServers(data.servers || [])
          setOrders(data.orders || [])
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (!authLoading) {
      fetchProfile()
    }
  }, [isAuthenticated, authLoading])

  // Редирект если не авторизован
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage("")

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, company }),
      })

      const data = await res.json()

      if (res.ok) {
        setSaveMessage("Профиль успешно обновлен")
        const updatedUser = await refreshUser()
        // Обновляем локальные стейты из полученных данных
        if (updatedUser) {
          setName(updatedUser.name || "")
          setPhone(updatedUser.phone || "")
          setCompany(updatedUser.company || "")
        }
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage(data.error || "Ошибка при сохранении")
      }
    } catch {
      setSaveMessage("Ошибка подключения к серверу")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordMessage("")
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают")
      setIsChangingPassword(false)
      return
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setPasswordMessage("Пароль успешно изменен")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordMessage(""), 3000)
      } else {
        setPasswordError(data.error || "Ошибка при смене пароля")
      }
    } catch {
      setPasswordError("Ошибка подключения к серверу")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
      ACTIVE: { variant: "default", label: "Активен", icon: <CheckCircle className="h-3 w-3" /> },
      PENDING: { variant: "secondary", label: "Ожидание", icon: <Clock className="h-3 w-3" /> },
      SUSPENDED: { variant: "destructive", label: "Приостановлен", icon: <AlertCircle className="h-3 w-3" /> },
      EXPIRED: { variant: "destructive", label: "Истек", icon: <XCircle className="h-3 w-3" /> },
      PAID: { variant: "default", label: "Оплачен", icon: <CheckCircle className="h-3 w-3" /> },
      CANCELLED: { variant: "destructive", label: "Отменен", icon: <XCircle className="h-3 w-3" /> },
    }
    const config = statusMap[status] || { variant: "outline" as const, label: status, icon: null }
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <main className="container py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* User Info Card */}
          <Card className="mb-8 border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  {user?.role === "ADMIN" && (
                    <Badge className="absolute -bottom-1 -right-1 bg-amber-500">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Зарегистрирован: {user?.createdAt ? formatDate(user.createdAt) : "—"}</span>
                    </div>
                    {user?.lastLoginAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Последний вход: {formatDate(user.lastLoginAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-primary/10 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="flex items-center justify-center gap-2 text-primary mb-1">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-medium">Баланс</span>
                  </div>
                  <div className="text-2xl font-bold">{user?.balance?.toFixed(2) || "0.00"} ₽</div>
                  <Button size="sm" className="mt-2 w-full">
                    Пополнить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4 hidden sm:block" />
                Обзор
              </TabsTrigger>
              <TabsTrigger value="servers" className="gap-2">
                <HardDrive className="h-4 w-4 hidden sm:block" />
                Серверы
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <CreditCard className="h-4 w-4 hidden sm:block" />
                Платежи
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4 hidden sm:block" />
                Настройки
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Stats Cards */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      Мои серверы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : servers.length > 0 ? (
                      <div className="space-y-3">
                        {servers.slice(0, 3).map((server) => (
                          <div key={server.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{server.name}</p>
                              <p className="text-sm text-muted-foreground">{server.plan.name}</p>
                            </div>
                            {getStatusBadge(server.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>У вас пока нет серверов</p>
                        <Button className="mt-3" size="sm">
                          Заказать сервер
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Последние заказы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{order.plan.name}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{order.amount} ₽</p>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Нет заказов</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Servers Tab */}
            <TabsContent value="servers">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Мои серверы</CardTitle>
                      <CardDescription>Управление вашими серверами</CardDescription>
                    </div>
                    <Button>
                      <Server className="h-4 w-4 mr-2" />
                      Заказать сервер
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : servers.length > 0 ? (
                    <div className="space-y-4">
                      {servers.map((server) => (
                        <div key={server.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <HardDrive className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{server.name}</p>
                              <p className="text-sm text-muted-foreground">{server.plan.name} • {server.plan.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Истекает</p>
                              <p className="text-sm font-medium">{formatDate(server.expiresAt)}</p>
                            </div>
                            {getStatusBadge(server.status)}
                            <Button variant="outline" size="sm">Управление</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">У вас пока нет серверов</h3>
                      <p className="mb-4">Закажите свой первый сервер прямо сейчас</p>
                      <Button>Заказать сервер</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>История платежей</CardTitle>
                  <CardDescription>Все ваши транзакции</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{order.plan.name}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold">{order.amount} ₽</p>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Нет платежей</h3>
                      <p>История ваших транзакций появится здесь</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Личные данные
                    </CardTitle>
                    <CardDescription>Обновите информацию о себе</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Имя</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="profile-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10"
                            placeholder="Ваше имя"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="profile-email"
                            value={user?.email || ""}
                            className="pl-10 bg-muted"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-phone">Телефон</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="profile-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10"
                            placeholder="+7 (999) 999-99-99"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-company">Компания</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="profile-company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="pl-10"
                            placeholder="Название компании"
                          />
                        </div>
                      </div>

                      {saveMessage && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`text-sm ${saveMessage.includes("Ошибка") ? "text-destructive" : "text-green-600"}`}
                        >
                          {saveMessage}
                        </motion.p>
                      )}

                      <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Сохранить изменения
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Смена пароля
                    </CardTitle>
                    <CardDescription>Обновите пароль для безопасности</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Текущий пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">Новый пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Минимум 8 символов"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Подтвердите пароль</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirm-new-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10"
                            placeholder="Повторите пароль"
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive">
                          {passwordError}
                        </motion.p>
                      )}

                      {passwordMessage && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600">
                          {passwordMessage}
                        </motion.p>
                      )}

                      <Button type="submit" variant="outline" className="w-full" disabled={isChangingPassword}>
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Смена пароля...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Сменить пароль
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}
