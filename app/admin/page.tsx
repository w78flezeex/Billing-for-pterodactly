"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  LayoutDashboard,
  Users,
  Server,
  MessageSquare,
  CreditCard,
  Settings,
  TrendingUp,
  TrendingDown,
  Search,
  MoreHorizontal,
  Loader2,
  ArrowUpRight,
  DollarSign,
  UserPlus,
  Activity,
  Plus,
  Ban,
  Play,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Gift,
  MapPin,
  Package,
  Tag,
  BarChart3,
  Percent,
  BookOpen,
  Mail,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface AdminStats {
  stats: {
    users: {
      total: number
      newThisMonth: number
      growth: string
    }
    servers: {
      total: number
      active: number
    }
    revenue: {
      total: number
      thisMonth: number
      lastMonth: number
      growth: string
    }
    tickets: {
      open: number
    }
    transactions: {
      total: number
    }
    promocodes: {
      totalUsed: number
      totalDiscount: number
    }
  }
  serversByStatus: Record<string, number>
  recentUsers: any[]
  recentTransactions: any[]
}

interface User {
  id: string
  email: string
  name?: string
  role: string
  balance: number
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  _count: {
    servers: number
    tickets: number
    referredUsers: number
  }
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  user: {
    email: string
    name?: string
  }
  _count: { messages: number }
}

interface ServerItem {
  id: string
  name: string
  status: string
  ipAddress?: string
  port?: number
  expiresAt: string
  autoRenew: boolean
  createdAt: string
  user: { id: string; email: string; name?: string }
  plan: { id: string; name: string; type: string; price: number }
  location?: { id: string; name: string; flag: string }
}

interface Transaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description?: string
  status: string
  createdAt: string
  user: { id: string; email: string; name?: string }
}

interface Plan {
  id: string
  name: string
  type: string
  price: number
  isActive: boolean
  isPopular: boolean
  _count: { servers: number; orders: number }
}

interface Location {
  id: string
  name: string
  country: string
  city: string
  flag: string
  isActive: boolean
  _count: { servers: number }
}

interface Promocode {
  id: string
  code: string
  type: string
  value: number
  isActive: boolean
  usedCount: number
  maxUses?: number
  validUntil?: string
  _count: { usages: number }
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<AdminStats | null>(null)
  
  // Users
  const [users, setUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState("")
  
  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketStatus, setTicketStatus] = useState("all")
  
  // Servers
  const [servers, setServers] = useState<ServerItem[]>([])
  const [serverSearch, setServerSearch] = useState("")
  const [serverStatus, setServerStatus] = useState("all")
  const [serverLoading, setServerLoading] = useState(false)
  
  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionSearch, setTransactionSearch] = useState("")
  const [transactionType, setTransactionType] = useState("all")
  const [transactionStats, setTransactionStats] = useState<any>(null)
  const [transactionLoading, setTransactionLoading] = useState(false)
  
  // Settings
  const [plans, setPlans] = useState<Plan[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [promocodes, setPromocodes] = useState<Promocode[]>([])
  const [settingsLoading, setSettingsLoading] = useState(false)
  
  // Dialogs
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [bonusAmount, setBonusAmount] = useState("")
  const [bonusDescription, setBonusDescription] = useState("")

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (!loading) {
      if (activeTab === "users") {
        fetchUsers()
      } else if (activeTab === "tickets") {
        fetchTickets()
      } else if (activeTab === "servers") {
        fetchServers()
      } else if (activeTab === "billing") {
        fetchTransactions()
      } else if (activeTab === "settings") {
        fetchSettings()
      }
    }
  }, [activeTab, userSearch, ticketStatus, serverSearch, serverStatus, transactionSearch, transactionType, loading])

  const checkAdminAccess = async () => {
    try {
      // In development, ensure we use HTTP not HTTPS
      const baseUrl = typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname === 'localhost'
        ? `http://${window.location.host}`
        : ''
      
      const res = await fetch(`${baseUrl}/api/auth/me`)
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      const userRole = data.user?.role?.toUpperCase?.() || data.user?.role
      if (userRole !== "ADMIN") {
        router.push("/profile")
        return
      }
      setLoading(false)
      fetchStats()
    } catch (error) {
      console.error("Admin check error:", error)
      // If SSL error, try to redirect to HTTP version
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname === 'localhost') {
        window.location.href = window.location.href.replace('https:', 'http:')
        return
      }
      router.push("/login")
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${userSearch}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      const statusParam = ticketStatus === "all" ? "" : ticketStatus
      const res = await fetch(`/api/admin/tickets?status=${statusParam}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const fetchServers = async () => {
    setServerLoading(true)
    try {
      const statusParam = serverStatus === "all" ? "" : serverStatus
      const res = await fetch(`/api/admin/servers?search=${serverSearch}&status=${statusParam}`)
      const data = await res.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error("Error fetching servers:", error)
    } finally {
      setServerLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setTransactionLoading(true)
    try {
      const typeParam = transactionType === "all" ? "" : transactionType
      const res = await fetch(`/api/admin/transactions?search=${transactionSearch}&type=${typeParam}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTransactionStats(data.stats)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setTransactionLoading(false)
    }
  }

  const fetchSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch("/api/admin/settings")
      const data = await res.json()
      setPlans(data.plans || [])
      setLocations(data.locations || [])
      setPromocodes(data.promocodes || [])
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setSettingsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const updateServerStatus = async (serverId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchServers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error updating server:", error)
    }
  }

  const deleteServer = async (serverId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот сервер?")) return
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchServers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error deleting server:", error)
    }
  }

  const addBonus = async () => {
    if (!selectedUser || !bonusAmount) return
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          type: "BONUS",
          amount: parseFloat(bonusAmount),
          description: bonusDescription || "Бонус от администратора",
        }),
      })
      if (res.ok) {
        setBonusDialogOpen(false)
        setBonusAmount("")
        setBonusDescription("")
        setSelectedUser(null)
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error adding bonus:", error)
    }
  }

  const togglePromocode = async (promocodeId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promocodes/${promocodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        fetchSettings()
      }
    } catch (error) {
      console.error("Error toggling promocode:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ACTIVE: { variant: "default", label: "Активен" },
      PENDING: { variant: "secondary", label: "Ожидает" },
      INSTALLING: { variant: "secondary", label: "Установка" },
      SUSPENDED: { variant: "destructive", label: "Заблокирован" },
      EXPIRED: { variant: "outline", label: "Истёк" },
      TERMINATED: { variant: "destructive", label: "Удалён" },
    }
    const config = statusConfig[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      DEPOSIT: { variant: "default", label: "Пополнение" },
      WITHDRAWAL: { variant: "destructive", label: "Вывод" },
      PURCHASE: { variant: "outline", label: "Покупка" },
      REFUND: { variant: "secondary", label: "Возврат" },
      REFERRAL: { variant: "default", label: "Реферал" },
      PROMOCODE: { variant: "default", label: "Промокод" },
      BONUS: { variant: "default", label: "Бонус" },
    }
    const config = typeConfig[type] || { variant: "secondary", label: type }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r bg-card p-4 hidden lg:block sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          <nav className="space-y-1">
            {/* Основные */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Основные</p>
            </div>
            {[
              { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
              { id: "users", label: "Пользователи", icon: Users },
              { id: "servers", label: "Серверы", icon: Server },
              { id: "tickets", label: "Тикеты", icon: MessageSquare },
              { id: "billing", label: "Финансы", icon: CreditCard },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}

            {/* Управление */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Управление</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/plans")}
            >
              <Package className="mr-2 h-4 w-4" />
              Тарифы
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/promocodes")}
            >
              <Percent className="mr-2 h-4 w-4" />
              Промокоды
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Локации
            </Button>

            {/* Аналитика */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Аналитика</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/reports")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Финансовые отчёты
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/analytics/dashboard")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Статистика
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/payments")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Платежи
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>

            {/* Биллинг */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Биллинг</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/refunds")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Возвраты
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/withdrawals")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Заявки на вывод
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/gift-certificates")}
            >
              <Gift className="mr-2 h-4 w-4" />
              Сертификаты
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/mass-bonus")}
            >
              <Tag className="mr-2 h-4 w-4" />
              Массовые бонусы
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/fraud")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Детектор фрода
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>

            {/* Контент */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Контент</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/knowledge")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              База знаний
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>

            {/* Интеграции */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Интеграции</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/pterodactyl")}
            >
              <Database className="mr-2 h-4 w-4" />
              Pterodactyl
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/settings/payments")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Платёжные системы
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>

            {/* Настройки */}
            <div className="px-3 py-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Настройки</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Настройки сайта
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Панель управления</h1>

              {/* Stats cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Пользователи
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.users.total}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <UserPlus className="mr-1 h-3 w-3" />
                      +{stats.stats.users.newThisMonth} за месяц
                      <span className={`ml-2 flex items-center ${
                        parseFloat(stats.stats.users.growth) >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {parseFloat(stats.stats.users.growth) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {stats.stats.users.growth}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Серверы
                    </CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.servers.total}</div>
                    <div className="text-xs text-muted-foreground">
                      <Activity className="inline mr-1 h-3 w-3" />
                      {stats.stats.servers.active} активных
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Доход за месяц
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.revenue.thisMonth.toLocaleString()} ₽</div>
                    <div className={`flex items-center text-xs ${
                      parseFloat(stats.stats.revenue.growth) >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {parseFloat(stats.stats.revenue.growth) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {stats.stats.revenue.growth}% vs прошлый месяц
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Открытые тикеты
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.tickets.open}</div>
                    <div className="text-xs text-muted-foreground">
                      требуют внимания
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Новые пользователи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentUsers.slice(0, 5).map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name || user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Последние транзакции</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentTransactions.slice(0, 5).map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{tx.user?.name || tx.user?.email || "—"}</p>
                            <p className="text-sm text-muted-foreground">{tx.description || tx.type}</p>
                          </div>
                          <div className={`font-medium ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {tx.amount >= 0 ? "+" : ""}{tx.amount} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Пользователи</h1>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      className="pl-10 w-64"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Баланс</TableHead>
                      <TableHead>Серверы</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name || "—"}</TableCell>
                        <TableCell>{user.balance.toLocaleString()} ₽</TableCell>
                        <TableCell>{user._count.servers}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Действия</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user)
                                setBonusDialogOpen(true)
                              }}>
                                <Gift className="mr-2 h-4 w-4" />
                                Начислить бонус
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}>
                                <Users className="mr-2 h-4 w-4" />
                                {user.role === "ADMIN" ? "Снять админа" : "Сделать админом"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Подробнее
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Tickets */}
          {activeTab === "tickets" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Тикеты</h1>
                <Select value={ticketStatus} onValueChange={setTicketStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="OPEN">Открытые</SelectItem>
                    <SelectItem value="WAITING">Ожидают ответа</SelectItem>
                    <SelectItem value="ANSWERED">Отвеченные</SelectItem>
                    <SelectItem value="CLOSED">Закрытые</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тема</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Сообщения</TableHead>
                      <TableHead>Обновлен</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Нет тикетов
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>{ticket.user?.name || ticket.user?.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              ticket.status === "OPEN" ? "default" :
                              ticket.status === "WAITING" ? "secondary" :
                              ticket.status === "ANSWERED" ? "outline" : "secondary"
                            }>
                              {ticket.status === "OPEN" ? "Открыт" :
                               ticket.status === "WAITING" ? "Ожидает" :
                               ticket.status === "ANSWERED" ? "Отвечен" : "Закрыт"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              ticket.priority === "URGENT" ? "destructive" :
                              ticket.priority === "HIGH" ? "default" : "secondary"
                            }>
                              {ticket.priority === "URGENT" ? "Срочный" :
                               ticket.priority === "HIGH" ? "Высокий" :
                               ticket.priority === "NORMAL" ? "Обычный" : "Низкий"}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket._count.messages}</TableCell>
                          <TableCell>
                            {new Date(ticket.updatedAt).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Servers */}
          {activeTab === "servers" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Серверы</h1>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      className="pl-10 w-64"
                      value={serverSearch}
                      onChange={(e) => setServerSearch(e.target.value)}
                    />
                  </div>
                  <Select value={serverStatus} onValueChange={setServerStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="ACTIVE">Активные</SelectItem>
                      <SelectItem value="PENDING">Ожидают</SelectItem>
                      <SelectItem value="SUSPENDED">Заблокированы</SelectItem>
                      <SelectItem value="EXPIRED">Истёкшие</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchServers}>
                    <RefreshCw className={`h-4 w-4 ${serverLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Тариф</TableHead>
                      <TableHead>Локация</TableHead>
                      <TableHead>IP:Port</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Истекает</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serverLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : servers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Нет серверов
                        </TableCell>
                      </TableRow>
                    ) : (
                      servers.map((server) => (
                        <TableRow key={server.id}>
                          <TableCell className="font-medium">{server.name}</TableCell>
                          <TableCell>{server.user?.name || server.user?.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{server.plan?.name}</Badge>
                          </TableCell>
                          <TableCell>
                            {server.location ? (
                              <span>{server.location.flag} {server.location.name}</span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {server.ipAddress ? `${server.ipAddress}:${server.port}` : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(server.status)}</TableCell>
                          <TableCell>
                            {new Date(server.expiresAt).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {server.status === "SUSPENDED" ? (
                                  <DropdownMenuItem onClick={() => updateServerStatus(server.id, "ACTIVE")}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Разблокировать
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => updateServerStatus(server.id, "SUSPENDED")}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Заблокировать
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteServer(server.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Billing / Transactions */}
          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Финансы</h1>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      className="pl-10 w-64"
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                    />
                  </div>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="DEPOSIT">Пополнения</SelectItem>
                      <SelectItem value="PURCHASE">Покупки</SelectItem>
                      <SelectItem value="REFUND">Возвраты</SelectItem>
                      <SelectItem value="BONUS">Бонусы</SelectItem>
                      <SelectItem value="REFERRAL">Рефералы</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchTransactions}>
                    <RefreshCw className={`h-4 w-4 ${transactionLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Stats cards */}
              {transactionStats && (
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Всего транзакций</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{transactionStats.totalCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Общий оборот</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{transactionStats.totalAmount?.toLocaleString()} ₽</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Пополнения</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">+{transactionStats.deposits?.toLocaleString()} ₽</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Покупки</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">-{transactionStats.purchases?.toLocaleString()} ₽</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Баланс</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Нет транзакций
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {new Date(tx.createdAt).toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>{tx.user?.name || tx.user?.email}</TableCell>
                          <TableCell>{getTransactionTypeBadge(tx.type)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {tx.description || "—"}
                          </TableCell>
                          <TableCell className={tx.amount >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                            {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()} ₽
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {tx.balanceBefore.toLocaleString()} → {tx.balanceAfter.toLocaleString()} ₽
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === "COMPLETED" ? "default" : tx.status === "PENDING" ? "secondary" : "destructive"}>
                              {tx.status === "COMPLETED" ? "Завершено" : tx.status === "PENDING" ? "Ожидает" : "Ошибка"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Настройки</h1>
                <Button variant="outline" size="icon" onClick={fetchSettings}>
                  <RefreshCw className={`h-4 w-4 ${settingsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <Tabs defaultValue="plans" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="plans">
                    <Package className="mr-2 h-4 w-4" />
                    Тарифы
                  </TabsTrigger>
                  <TabsTrigger value="locations">
                    <MapPin className="mr-2 h-4 w-4" />
                    Локации
                  </TabsTrigger>
                  <TabsTrigger value="promocodes">
                    <Tag className="mr-2 h-4 w-4" />
                    Промокоды
                  </TabsTrigger>
                </TabsList>

                {/* Plans */}
                <TabsContent value="plans" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Тарифные планы</h2>
                    <Button onClick={() => router.push("/admin/plans/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить тариф
                    </Button>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Название</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Серверов</TableHead>
                          <TableHead>Заказов</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Нет тарифов
                            </TableCell>
                          </TableRow>
                        ) : (
                          plans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">
                                {plan.name}
                                {plan.isPopular && <Badge className="ml-2" variant="default">Популярный</Badge>}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{plan.type}</Badge>
                              </TableCell>
                              <TableCell>{plan.price.toLocaleString()} ₽/мес</TableCell>
                              <TableCell>{plan._count.servers}</TableCell>
                              <TableCell>{plan._count.orders}</TableCell>
                              <TableCell>
                                {plan.isActive ? (
                                  <Badge variant="default">Активен</Badge>
                                ) : (
                                  <Badge variant="secondary">Неактивен</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/plans/${plan.id}`)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                {/* Locations */}
                <TabsContent value="locations" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Локации серверов</h2>
                    <Button onClick={() => router.push("/admin/locations/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить локацию
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.length === 0 ? (
                      <Card className="col-span-full">
                        <CardContent className="text-center text-muted-foreground py-8">
                          Нет локаций
                        </CardContent>
                      </Card>
                    ) : (
                      locations.map((location) => (
                        <Card key={location.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-2xl">{location.flag}</span>
                              {location.name}
                            </CardTitle>
                            <CardDescription>{location.city}, {location.country}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                <Server className="inline mr-1 h-4 w-4" />
                                {location._count.servers} серверов
                              </div>
                              <Badge variant={location.isActive ? "default" : "secondary"}>
                                {location.isActive ? "Активна" : "Неактивна"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Promocodes */}
                <TabsContent value="promocodes" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Промокоды</h2>
                    <Button onClick={() => router.push("/admin/promocodes/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Создать промокод
                    </Button>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Код</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Значение</TableHead>
                          <TableHead>Использований</TableHead>
                          <TableHead>Действует до</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promocodes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Нет промокодов
                            </TableCell>
                          </TableRow>
                        ) : (
                          promocodes.map((promo) => (
                            <TableRow key={promo.id}>
                              <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {promo.type === "FIXED" ? "Фикс. сумма" :
                                   promo.type === "PERCENT" ? "Процент" : "Баланс"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {promo.type === "PERCENT" ? `${promo.value}%` : `${promo.value} ₽`}
                              </TableCell>
                              <TableCell>
                                {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ""}
                              </TableCell>
                              <TableCell>
                                {promo.validUntil 
                                  ? new Date(promo.validUntil).toLocaleDateString("ru-RU")
                                  : "Бессрочно"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={promo.isActive ? "default" : "secondary"}>
                                  {promo.isActive ? "Активен" : "Неактивен"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => togglePromocode(promo.id, promo.isActive)}>
                                      {promo.isActive ? (
                                        <>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Деактивировать
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Активировать
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/admin/promocodes/${promo.id}`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Редактировать
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </main>
      </div>

      {/* Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Начислить бонус</DialogTitle>
            <DialogDescription>
              Начисление бонуса пользователю {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Сумма (₽)</Label>
              <Input
                type="number"
                placeholder="100"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Описание (необязательно)</Label>
              <Textarea
                placeholder="Причина начисления бонуса..."
                value={bonusDescription}
                onChange={(e) => setBonusDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={addBonus} disabled={!bonusAmount}>
              <Gift className="mr-2 h-4 w-4" />
              Начислить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
