"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Gift,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react"
import Link from "next/link"

interface Promocode {
  id: string
  code: string
  type: "PERCENT" | "FIXED" | "BONUS"
  value: number
  minAmount: number | null
  maxUses: number | null
  maxUsesPerUser: number
  usedCount: number
  validUntil: string | null
  isActive: boolean
  planTypes: string[]
  createdAt: string
  _count?: {
    usages: number
  }
}

interface Plan {
  id: string
  name: string
  type: string
}

export default function PromocodesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [promocodes, setPromocodes] = useState<Promocode[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usagesDialogOpen, setUsagesDialogOpen] = useState(false)
  const [selectedPromocode, setSelectedPromocode] = useState<Promocode | null>(null)
  const [usages, setUsages] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED" | "BONUS",
    value: 0,
    minAmount: "",
    maxUses: "",
    maxUsesPerUser: 1,
    expiresAt: "",
    applicablePlanIds: [] as string[],
    isActive: true,
  })
  const [submitting, setSubmitting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalUsages: 0,
    totalDiscount: 0,
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      if (data.user?.role !== "ADMIN") {
        router.push("/profile")
        return
      }
      setLoading(false)
      fetchPromocodes()
      fetchPlans()
    } catch (error) {
      router.push("/login")
    }
  }

  const fetchPromocodes = async () => {
    try {
      const res = await fetch("/api/admin/promocodes")
      const data = await res.json()
      if (data.promocodes) {
        setPromocodes(data.promocodes)
        calculateStats(data.promocodes)
      }
    } catch (error) {
      toast.error("Ошибка загрузки промокодов")
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    }
  }

  const calculateStats = (codes: Promocode[]) => {
    const now = new Date()
    const active = codes.filter(p => p.isActive && (!p.validUntil || new Date(p.validUntil) > now))
    const expired = codes.filter(p => p.validUntil && new Date(p.validUntil) <= now)
    const totalUsages = codes.reduce((sum, p) => sum + (p._count?.usages || p.usedCount || 0), 0)
    
    setStats({
      total: codes.length,
      active: active.length,
      expired: expired.length,
      totalUsages,
      totalDiscount: 0, // Would need transaction data to calculate
    })
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleCreate = async () => {
    if (!formData.code || formData.value <= 0) {
      toast.error("Заполните обязательные поля")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: formData.value,
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser,
          expiresAt: formData.expiresAt || null,
          applicablePlanIds: formData.applicablePlanIds,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Промокод создан")
        setCreateDialogOpen(false)
        resetForm()
        fetchPromocodes()
      } else {
        toast.error(data.error || "Ошибка создания")
      }
    } catch (error) {
      toast.error("Ошибка при создании промокода")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPromocode || !formData.code || formData.value <= 0) {
      toast.error("Заполните обязательные поля")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/promocodes/${selectedPromocode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: formData.value,
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser,
          expiresAt: formData.expiresAt || null,
          applicablePlanIds: formData.applicablePlanIds,
          isActive: formData.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Промокод обновлён")
        setEditDialogOpen(false)
        resetForm()
        fetchPromocodes()
      } else {
        toast.error(data.error || "Ошибка обновления")
      }
    } catch (error) {
      toast.error("Ошибка при обновлении промокода")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPromocode) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/promocodes/${selectedPromocode.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Промокод удалён")
        setDeleteDialogOpen(false)
        setSelectedPromocode(null)
        fetchPromocodes()
      } else {
        toast.error(data.error || "Ошибка удаления")
      }
    } catch (error) {
      toast.error("Ошибка при удалении промокода")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (promocode: Promocode) => {
    try {
      const res = await fetch(`/api/admin/promocodes/${promocode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promocode.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(promocode.isActive ? "Промокод деактивирован" : "Промокод активирован")
        fetchPromocodes()
      }
    } catch (error) {
      toast.error("Ошибка при изменении статуса")
    }
  }

  const fetchUsages = async (promocode: Promocode) => {
    setSelectedPromocode(promocode)
    setUsagesDialogOpen(true)
    try {
      const res = await fetch(`/api/admin/promocodes/${promocode.id}/usages`)
      const data = await res.json()
      if (data.usages) {
        setUsages(data.usages)
      }
    } catch (error) {
      toast.error("Ошибка загрузки использований")
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Код скопирован")
  }

  const resetForm = () => {
    setFormData({
      code: "",
      type: "PERCENT",
      value: 0,
      minAmount: "",
      maxUses: "",
      maxUsesPerUser: 1,
      expiresAt: "",
      applicablePlanIds: [],
      isActive: true,
    })
  }

  const openEditDialog = (promocode: Promocode) => {
    setSelectedPromocode(promocode)
    setFormData({
      code: promocode.code,
      type: promocode.type,
      value: promocode.value,
      minAmount: promocode.minAmount?.toString() || "",
      maxUses: promocode.maxUses?.toString() || "",
      maxUsesPerUser: promocode.maxUsesPerUser,
      expiresAt: promocode.validUntil ? new Date(promocode.validUntil).toISOString().slice(0, 16) : "",
      applicablePlanIds: promocode.planTypes || [],
      isActive: promocode.isActive,
    })
    setEditDialogOpen(true)
  }

  const filteredPromocodes = promocodes.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || p.type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive) ||
      (statusFilter === "expired" && p.validUntil && new Date(p.validUntil) <= new Date())
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PERCENT": return <Percent className="h-4 w-4" />
      case "FIXED": return <DollarSign className="h-4 w-4" />
      case "BONUS": return <Gift className="h-4 w-4" />
      default: return <Tag className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENT": return "Процент"
      case "FIXED": return "Фикс. сумма"
      case "BONUS": return "Бонус"
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PERCENT": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "FIXED": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "BONUS": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default: return ""
    }
  }

  const formatValue = (promocode: Promocode) => {
    switch (promocode.type) {
      case "PERCENT": return `${promocode.value}%`
      case "FIXED": return `${promocode.value} ₽`
      case "BONUS": return `+${promocode.value} ₽`
      default: return promocode.value
    }
  }

  const isExpired = (promocode: Promocode) => {
    return promocode.validUntil && new Date(promocode.validUntil) <= new Date()
  }

  const isLimitReached = (promocode: Promocode) => {
    return promocode.maxUses && (promocode._count?.usages || promocode.usedCount) >= promocode.maxUses
  }

  const exportPromocodes = () => {
    const csv = [
      ["Код", "Тип", "Значение", "Мин. сумма", "Макс. использований", "Использовано", "Действует до", "Статус"].join(","),
      ...filteredPromocodes.map(p => [
        p.code,
        getTypeLabel(p.type),
        p.value,
        p.minAmount || "-",
        p.maxUses || "∞",
        p._count?.usages || p.usedCount || 0,
        p.validUntil ? new Date(p.validUntil).toLocaleDateString() : "Бессрочно",
        p.isActive ? "Активен" : "Неактивен"
      ].join(","))
    ].join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promocodes_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Промокоды</h1>
                <p className="text-sm text-muted-foreground">
                  Управление скидками и бонусами
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportPromocodes}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
              <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Создать промокод
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">промокодов</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активных</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                <p className="text-xs text-muted-foreground">готовы к использованию</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Истекших</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.expired}</div>
                <p className="text-xs text-muted-foreground">требуют внимания</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Использований</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.totalUsages}</div>
                <p className="text-xs text-muted-foreground">за всё время</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по коду..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="PERCENT">Процент</SelectItem>
                  <SelectItem value="FIXED">Фикс. сумма</SelectItem>
                  <SelectItem value="BONUS">Бонус</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                  <SelectItem value="expired">Истекшие</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchPromocodes}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Значение</TableHead>
                  <TableHead>Использований</TableHead>
                  <TableHead>Срок действия</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromocodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Промокоды не найдены</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { resetForm(); setCreateDialogOpen(true) }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Создать первый промокод
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromocodes.map((promocode) => (
                    <TableRow key={promocode.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-semibold">
                            {promocode.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(promocode.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(promocode.type)}>
                          {getTypeIcon(promocode.type)}
                          <span className="ml-1">{getTypeLabel(promocode.type)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatValue(promocode)}</span>
                        {promocode.minAmount && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (от {promocode.minAmount} ₽)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-normal"
                          onClick={() => fetchUsages(promocode)}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {promocode._count?.usages || promocode.usedCount || 0}
                          {promocode.maxUses && (
                            <span className="text-muted-foreground">
                              /{promocode.maxUses}
                            </span>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {promocode.validUntil ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={isExpired(promocode) ? "text-red-500" : ""}>
                              {new Date(promocode.validUntil).toLocaleDateString("ru")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Бессрочно</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpired(promocode) ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Истёк
                          </Badge>
                        ) : isLimitReached(promocode) ? (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Лимит
                          </Badge>
                        ) : promocode.isActive ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Активен
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Неактивен
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(promocode)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fetchUsages(promocode)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Использования
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyCode(promocode.code)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Копировать код
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(promocode)}>
                              {promocode.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Деактивировать
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Активировать
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => { setSelectedPromocode(promocode); setDeleteDialogOpen(true) }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать промокод</DialogTitle>
            <DialogDescription>
              Заполните параметры нового промокода
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Код</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="SUMMER2024"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Процент скидки
                      </div>
                    </SelectItem>
                    <SelectItem value="FIXED">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Фиксированная сумма
                      </div>
                    </SelectItem>
                    <SelectItem value="BONUS">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Бонус на баланс
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.type === "PERCENT" ? "Процент" : "Сумма (₽)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={formData.type === "PERCENT" ? 100 : undefined}
                  value={formData.value || ""}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Мин. сумма заказа (₽)</Label>
                <Input
                  type="number"
                  placeholder="Не ограничено"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Макс. использований</Label>
                <Input
                  type="number"
                  placeholder="Не ограничено"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>На пользователя</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Действует до</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            {plans.length > 0 && (
              <div className="space-y-2">
                <Label>Применим к тарифам</Label>
                <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`plan-${plan.id}`}
                        checked={formData.applicablePlanIds.includes(plan.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              applicablePlanIds: [...formData.applicablePlanIds, plan.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              applicablePlanIds: formData.applicablePlanIds.filter((id) => id !== plan.id),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`plan-${plan.id}`} className="text-sm">
                        {plan.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Если не выбрано — применим ко всем тарифам
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать промокод</DialogTitle>
            <DialogDescription>
              Изменение параметров промокода
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Код</Label>
              <Input
                placeholder="SUMMER2024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Процент</SelectItem>
                    <SelectItem value="FIXED">Фикс. сумма</SelectItem>
                    <SelectItem value="BONUS">Бонус</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.type === "PERCENT" ? "Процент" : "Сумма (₽)"}
                </Label>
                <Input
                  type="number"
                  value={formData.value || ""}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Мин. сумма заказа</Label>
                <Input
                  type="number"
                  placeholder="Не ограничено"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Макс. использований</Label>
                <Input
                  type="number"
                  placeholder="Не ограничено"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>На пользователя</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Действует до</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить промокод?</DialogTitle>
            <DialogDescription>
              Промокод <strong>{selectedPromocode?.code}</strong> будет удалён без возможности восстановления.
              История использований также будет удалена.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usages Dialog */}
      <Dialog open={usagesDialogOpen} onOpenChange={setUsagesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История использований</DialogTitle>
            <DialogDescription>
              Промокод: <code className="bg-muted px-2 py-1 rounded">{selectedPromocode?.code}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {usages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Промокод ещё не использовался</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Скидка</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage: any) => (
                    <TableRow key={usage.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usage.user?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{usage.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{usage.discountAmount} ₽</TableCell>
                      <TableCell>
                        {new Date(usage.createdAt).toLocaleString("ru")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
