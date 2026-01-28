"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Star,
  StarOff,
  GripVertical,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Shield,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Settings
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Типы
interface Plan {
  id: string
  name: string
  description: string | null
  type: "VDS" | "VPS" | "DEDICATED" | "GAME" | "WEB"
  price: number
  priceYearly: number | null
  features: string[]
  specs: {
    cpu?: number
    ram?: number
    disk?: number
    bandwidth?: number
    ipv4?: number
  }
  isActive: boolean
  isPopular: boolean
  sortOrder: number
  pterodactylNestId: number | null
  pterodactylEggId: number | null
  createdAt: string
  locations: Array<{
    location: {
      id: string
      name: string
      country: string
      flag: string
    }
  }>
  _count: {
    servers: number
    orders: number
  }
}

interface Location {
  id: string
  name: string
  country: string
  flag: string
}

const planTypeInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  VDS: { label: "VDS", icon: <Server className="h-4 w-4" />, color: "bg-blue-500" },
  VPS: { label: "VPS", icon: <Cpu className="h-4 w-4" />, color: "bg-purple-500" },
  DEDICATED: { label: "Dedicated", icon: <HardDrive className="h-4 w-4" />, color: "bg-orange-500" },
  GAME: { label: "Game", icon: <Zap className="h-4 w-4" />, color: "bg-green-500" },
  WEB: { label: "Web", icon: <Globe className="h-4 w-4" />, color: "bg-cyan-500" },
}

const defaultSpecs = {
  cpu: 1,
  ram: 1024,
  disk: 20,
  bandwidth: 100,
  ipv4: 1,
}

const defaultPlan: Omit<Plan, "id" | "createdAt" | "locations" | "_count"> = {
  name: "",
  description: "",
  type: "VDS",
  price: 0,
  priceYearly: null,
  features: [],
  specs: defaultSpecs,
  isActive: true,
  isPopular: false,
  sortOrder: 0,
  pterodactylNestId: null,
  pterodactylEggId: null,
}

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortMode, setSortMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("")
  const [pricePercent, setPricePercent] = useState(10)
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState(defaultPlan)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [featuresText, setFeaturesText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Загрузка данных
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      toast.error("Ошибка загрузки тарифов")
    }
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/locations")
      const data = await res.json()
      if (data.locations) {
        setLocations(data.locations)
      }
    } catch (error) {
      console.error("Ошибка загрузки локаций:", error)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchPlans(), fetchLocations()]).finally(() => setLoading(false))
  }, [fetchPlans, fetchLocations])

  // Фильтрация
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || plan.type === filterType
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && plan.isActive) ||
      (filterStatus === "inactive" && !plan.isActive)
    return matchesSearch && matchesType && matchesStatus
  })

  // Handlers
  const handleCreate = () => {
    setFormData(defaultPlan)
    setSelectedLocations([])
    setFeaturesText("")
    setIsCreateOpen(true)
  }

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || "",
      type: plan.type,
      price: plan.price,
      priceYearly: plan.priceYearly,
      features: plan.features,
      specs: plan.specs || defaultSpecs,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      pterodactylNestId: plan.pterodactylNestId,
      pterodactylEggId: plan.pterodactylEggId,
    })
    setSelectedLocations(plan.locations.map(l => l.location.id))
    setFeaturesText(plan.features.join("\n"))
    setIsEditOpen(true)
  }

  const handleDuplicate = async (plan: Plan) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${plan.name} (копия)`,
          description: plan.description,
          type: plan.type,
          price: plan.price,
          priceYearly: plan.priceYearly,
          features: plan.features,
          specs: plan.specs,
          isActive: false,
          isPopular: false,
          sortOrder: plan.sortOrder + 1,
          pterodactylNestId: plan.pterodactylNestId,
          pterodactylEggId: plan.pterodactylEggId,
          locationIds: plan.locations.map(l => l.location.id),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Тариф скопирован")
        fetchPlans()
      } else {
        toast.error(data.error || "Ошибка копирования")
      }
    } catch (error) {
      toast.error("Ошибка при копировании")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDeleteOpen(true)
  }

  const handlePreview = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsPreviewOpen(true)
  }

  const toggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(plan.isActive ? "Тариф деактивирован" : "Тариф активирован")
        fetchPlans()
      }
    } catch (error) {
      toast.error("Ошибка при обновлении")
    }
  }

  const togglePopular = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: !plan.isPopular }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(plan.isPopular ? "Метка популярности снята" : "Тариф помечен как популярный")
        fetchPlans()
      }
    } catch (error) {
      toast.error("Ошибка при обновлении")
    }
  }

  const submitCreate = async () => {
    if (!formData.name || formData.price < 0) {
      toast.error("Заполните обязательные поля")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: featuresText.split("\n").filter(f => f.trim()),
          locationIds: selectedLocations,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Тариф создан")
        setIsCreateOpen(false)
        fetchPlans()
      } else {
        toast.error(data.error || "Ошибка создания")
      }
    } catch (error) {
      toast.error("Ошибка при создании")
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedPlan) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: featuresText.split("\n").filter(f => f.trim()),
          locationIds: selectedLocations,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Тариф обновлён")
        setIsEditOpen(false)
        fetchPlans()
      } else {
        toast.error(data.error || "Ошибка обновления")
      }
    } catch (error) {
      toast.error("Ошибка при обновлении")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedPlan) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Тариф удалён")
        setIsDeleteOpen(false)
        fetchPlans()
      } else {
        toast.error(data.error || "Ошибка удаления")
      }
    } catch (error) {
      toast.error("Ошибка при удалении")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReorder = async (newOrder: Plan[]) => {
    setPlans(newOrder)
    
    // Обновляем sortOrder для всех планов
    try {
      await Promise.all(
        newOrder.map((plan, index) =>
          fetch(`/api/admin/plans/${plan.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: index }),
          })
        )
      )
      toast.success("Порядок сохранён")
    } catch (error) {
      toast.error("Ошибка сохранения порядка")
      fetchPlans()
    }
  }

  // Массовый выбор
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPlans.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPlans.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Массовые операции
  const executeBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/plans/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planIds: selectedIds,
          action: bulkAction,
          value: pricePercent,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Обновлено: ${data.updatedCount} тарифов`)
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((err: string) => toast.warning(err))
        }
        setSelectedIds([])
        setIsBulkOpen(false)
        fetchPlans()
      } else {
        toast.error(data.error || "Ошибка выполнения")
      }
    } catch (error) {
      toast.error("Ошибка при выполнении операции")
    } finally {
      setSubmitting(false)
    }
  }

  // Экспорт тарифов
  const exportPlans = () => {
    const data = plans.map(p => ({
      name: p.name,
      type: p.type,
      price: p.price,
      priceYearly: p.priceYearly,
      specs: p.specs,
      features: p.features,
      isActive: p.isActive,
      isPopular: p.isPopular,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `plans-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Тарифы экспортированы")
  }

  // Статистика
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.isActive).length,
    servers: plans.reduce((acc, p) => acc + p._count.servers, 0),
    revenue: plans.reduce((acc, p) => acc + (p._count.servers * p.price), 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка тарифов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Управление тарифами
                </h1>
                <p className="text-sm text-muted-foreground">
                  Создание, редактирование и настройка тарифных планов
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPlans}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
              <Button variant="outline" size="sm" onClick={exportPlans}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Создать тариф
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Всего тарифов</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Активных</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Серверов на тарифах</p>
                    <p className="text-2xl font-bold">{stats.servers}</p>
                  </div>
                  <Server className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Потенциальный доход</p>
                    <p className="text-2xl font-bold">{stats.revenue.toLocaleString()} ₽</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск тарифов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {Object.entries(planTypeInfo).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={sortMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortMode(!sortMode)}
                  className="gap-2"
                >
                  <GripVertical className="h-4 w-4" />
                  {sortMode ? "Сохранить порядок" : "Сортировка"}
                </Button>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="6" height="6" rx="1" />
                      <rect x="9" y="1" width="6" height="6" rx="1" />
                      <rect x="1" y="9" width="6" height="6" rx="1" />
                      <rect x="9" y="9" width="6" height="6" rx="1" />
                    </svg>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="14" height="3" rx="1" />
                      <rect x="1" y="6" width="14" height="3" rx="1" />
                      <rect x="1" y="11" width="14" height="3" rx="1" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Selection Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.length === filteredPlans.length}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="font-medium">
                        Выбрано: {selectedIds.length} из {filteredPlans.length}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                        Снять выбор
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBulkAction("activate")
                          setIsBulkOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Активировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBulkAction("deactivate")
                          setIsBulkOpen(true)
                        }}
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Деактивировать
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4 mr-2" />
                            Ещё
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setBulkAction("set_popular")
                            setIsBulkOpen(true)
                          }}>
                            <Star className="h-4 w-4 mr-2" />
                            Сделать популярными
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setBulkAction("unset_popular")
                            setIsBulkOpen(true)
                          }}>
                            <StarOff className="h-4 w-4 mr-2" />
                            Убрать популярность
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setBulkAction("increase_price")
                            setIsBulkOpen(true)
                          }}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Повысить цены
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setBulkAction("decrease_price")
                            setIsBulkOpen(true)
                          }}>
                            <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                            Понизить цены
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setBulkAction("delete")
                              setIsBulkOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить выбранные
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans Grid/List */}
        <AnimatePresence mode="wait">
          {filteredPlans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Тарифы не найдены</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Попробуйте изменить параметры поиска" : "Создайте первый тариф"}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Создать тариф
              </Button>
            </motion.div>
          ) : sortMode ? (
            <Reorder.Group
              axis="y"
              values={filteredPlans}
              onReorder={handleReorder}
              className="space-y-3"
            >
              {filteredPlans.map((plan) => (
                <Reorder.Item key={plan.id} value={plan}>
                  <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div className={cn("w-2 h-10 rounded-full", planTypeInfo[plan.type].color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {plan.isPopular && (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Популярный
                            </Badge>
                          )}
                          {!plan.isActive && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                              Неактивен
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.type} • {plan.price} ₽/мес</p>
                      </div>
                      <Badge variant="outline">{plan._count.servers} серверов</Badge>
                    </CardContent>
                  </Card>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PlanCard
                    plan={plan}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onPreview={handlePreview}
                    onToggleActive={toggleActive}
                    onTogglePopular={togglePopular}
                    isSelected={selectedIds.includes(plan.id)}
                    onToggleSelect={toggleSelect}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <div className="divide-y">
                  {filteredPlans.map((plan) => (
                    <PlanListItem
                      key={plan.id}
                      plan={plan}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onPreview={handlePreview}
                      onToggleActive={toggleActive}
                      onTogglePopular={togglePopular}
                      isSelected={selectedIds.includes(plan.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Dialog */}
      <PlanFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Создать тариф"
        description="Заполните информацию для нового тарифного плана"
        formData={formData}
        setFormData={setFormData}
        featuresText={featuresText}
        setFeaturesText={setFeaturesText}
        locations={locations}
        selectedLocations={selectedLocations}
        setSelectedLocations={setSelectedLocations}
        onSubmit={submitCreate}
        submitting={submitting}
        submitLabel="Создать"
      />

      {/* Edit Dialog */}
      <PlanFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Редактировать тариф"
        description={`Изменение тарифа "${selectedPlan?.name}"`}
        formData={formData}
        setFormData={setFormData}
        featuresText={featuresText}
        setFeaturesText={setFeaturesText}
        locations={locations}
        selectedLocations={selectedLocations}
        setSelectedLocations={setSelectedLocations}
        onSubmit={submitEdit}
        submitting={submitting}
        submitLabel="Сохранить"
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Удалить тариф?
            </DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тариф "{selectedPlan?.name}"?
              {selectedPlan && selectedPlan._count.servers > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ На этом тарифе {selectedPlan._count.servers} активных серверов!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={submitting || (selectedPlan?._count.servers ?? 0) > 0}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Предпросмотр тарифа</DialogTitle>
          </DialogHeader>
          {selectedPlan && <PlanPreview plan={selectedPlan} />}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "delete" && "Удалить выбранные тарифы?"}
              {bulkAction === "activate" && "Активировать тарифы?"}
              {bulkAction === "deactivate" && "Деактивировать тарифы?"}
              {bulkAction === "set_popular" && "Сделать популярными?"}
              {bulkAction === "unset_popular" && "Убрать популярность?"}
              {bulkAction === "increase_price" && "Повысить цены?"}
              {bulkAction === "decrease_price" && "Понизить цены?"}
            </DialogTitle>
            <DialogDescription>
              Эта операция будет применена к {selectedIds.length} тарифам.
            </DialogDescription>
          </DialogHeader>
          
          {(bulkAction === "increase_price" || bulkAction === "decrease_price") && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Процент изменения цены</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={pricePercent}
                    onChange={(e) => setPricePercent(parseInt(e.target.value) || 10)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Цены будут {bulkAction === "increase_price" ? "увеличены" : "уменьшены"} на {pricePercent}%
                </p>
              </div>
            </div>
          )}

          {bulkAction === "delete" && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">
                  ⚠️ Тарифы с активными серверами не будут удалены
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkOpen(false)}>
              Отмена
            </Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={executeBulkAction}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Plan Card Component
function PlanCard({
  plan,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onToggleActive,
  onTogglePopular,
  isSelected,
  onToggleSelect,
}: {
  plan: Plan
  onEdit: (plan: Plan) => void
  onDelete: (plan: Plan) => void
  onDuplicate: (plan: Plan) => void
  onPreview: (plan: Plan) => void
  onToggleActive: (plan: Plan) => void
  onTogglePopular: (plan: Plan) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const typeInfo = planTypeInfo[plan.type]

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all hover:shadow-lg",
      !plan.isActive && "opacity-60",
      plan.isPopular && "ring-2 ring-yellow-500/50",
      isSelected && "ring-2 ring-primary"
    )}>
      {plan.isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 transform rotate-45 translate-x-6 translate-y-2">
            ★
          </div>
        </div>
      )}
      
      {onToggleSelect && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(plan.id)}
            className="bg-background"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pl-6">
            <div className={cn("p-2 rounded-lg", typeInfo.color, "text-white")}>
              {typeInfo.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <Badge variant="outline" className="mt-1">{typeInfo.label}</Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(plan)}>
                <Eye className="h-4 w-4 mr-2" />
                Предпросмотр
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(plan)}>
                <Copy className="h-4 w-4 mr-2" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(plan)}>
                {plan.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Деактивировать
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Активировать
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePopular(plan)}>
                {plan.isPopular ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Убрать популярность
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Сделать популярным
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(plan)}
                className="text-destructive focus:text-destructive"
                disabled={plan._count.servers > 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {plan.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
        
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
          <span className="text-muted-foreground">₽/мес</span>
          {plan.priceYearly && (
            <span className="text-sm text-muted-foreground ml-2">
              ({plan.priceYearly.toLocaleString()} ₽/год)
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="h-4 w-4" />
            <span>{plan.specs?.cpu || 1} vCPU</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>{plan.specs?.disk || 20} GB</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="h-4 w-4" />
            <span>{((plan.specs?.ram || 1024) / 1024).toFixed(1)} GB RAM</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wifi className="h-4 w-4" />
            <span>{plan.specs?.bandwidth || 100} Mbps</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Server className="h-4 w-4" />
            <span>{plan._count.servers} серверов</span>
          </div>
          <div className="flex-1" />
          {plan.locations.length > 0 && (
            <div className="flex -space-x-1">
              {plan.locations.slice(0, 3).map((loc) => (
                <span key={loc.location.id} className="text-lg" title={loc.location.name}>
                  {loc.location.flag}
                </span>
              ))}
              {plan.locations.length > 3 && (
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  +{plan.locations.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Plan List Item Component
function PlanListItem({
  plan,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onToggleActive,
  onTogglePopular,
  isSelected,
  onToggleSelect,
}: {
  plan: Plan
  onEdit: (plan: Plan) => void
  onDelete: (plan: Plan) => void
  onDuplicate: (plan: Plan) => void
  onPreview: (plan: Plan) => void
  onToggleActive: (plan: Plan) => void
  onTogglePopular: (plan: Plan) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const typeInfo = planTypeInfo[plan.type]

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
      !plan.isActive && "opacity-60",
      isSelected && "bg-primary/5"
    )}>
      {onToggleSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(plan.id)}
        />
      )}
      <div className={cn("p-2 rounded-lg", typeInfo.color, "text-white")}>
        {typeInfo.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{plan.name}</span>
          <Badge variant="outline" className="shrink-0">{typeInfo.label}</Badge>
          {plan.isPopular && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 shrink-0">
              <Star className="h-3 w-3 mr-1" />
              Популярный
            </Badge>
          )}
          {!plan.isActive && (
            <Badge variant="secondary" className="bg-red-500/10 text-red-600 shrink-0">
              Неактивен
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{plan.description}</p>
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Cpu className="h-4 w-4" />
          {plan.specs?.cpu || 1} vCPU
        </span>
        <span className="flex items-center gap-1">
          <Server className="h-4 w-4" />
          {((plan.specs?.ram || 1024) / 1024).toFixed(1)} GB
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="h-4 w-4" />
          {plan.specs?.disk || 20} GB
        </span>
      </div>
      
      <div className="text-right shrink-0">
        <div className="font-bold">{plan.price.toLocaleString()} ₽</div>
        <div className="text-xs text-muted-foreground">{plan._count.servers} серверов</div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPreview(plan)}>
            <Eye className="h-4 w-4 mr-2" />
            Предпросмотр
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(plan)}>
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(plan)}>
            <Copy className="h-4 w-4 mr-2" />
            Дублировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggleActive(plan)}>
            {plan.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {plan.isActive ? "Деактивировать" : "Активировать"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTogglePopular(plan)}>
            {plan.isPopular ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
            {plan.isPopular ? "Убрать популярность" : "Сделать популярным"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(plan)}
            className="text-destructive"
            disabled={plan._count.servers > 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Plan Form Dialog
function PlanFormDialog({
  open,
  onOpenChange,
  title,
  description,
  formData,
  setFormData,
  featuresText,
  setFeaturesText,
  locations,
  selectedLocations,
  setSelectedLocations,
  onSubmit,
  submitting,
  submitLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  formData: typeof defaultPlan
  setFormData: React.Dispatch<React.SetStateAction<typeof defaultPlan>>
  featuresText: string
  setFeaturesText: (text: string) => void
  locations: Location[]
  selectedLocations: string[]
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>
  onSubmit: () => void
  submitting: boolean
  submitLabel: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Основное</TabsTrigger>
            <TabsTrigger value="specs">Характеристики</TabsTrigger>
            <TabsTrigger value="features">Функции</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VDS Starter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Тип *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "VDS" | "VPS" | "DEDICATED" | "GAME" | "WEB") => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(planTypeInfo).map(([key, { label, icon }]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {icon}
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Идеально для небольших проектов и разработки"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена в месяц (₽) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Цена в год (₽)</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceYearly || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    priceYearly: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="Оставьте пустым для авто-расчёта"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Локации</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => {
                      if (selectedLocations.includes(location.id)) {
                        setSelectedLocations(selectedLocations.filter(id => id !== location.id))
                      } else {
                        setSelectedLocations([...selectedLocations, location.id])
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                      selectedLocations.includes(location.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span>{location.flag}</span>
                    <span className="text-sm">{location.name}</span>
                    {selectedLocations.includes(location.id) && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                ))}
                {locations.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет доступных локаций</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specs" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpu">CPU (vCPU)</Label>
                <Input
                  id="cpu"
                  type="number"
                  min="1"
                  value={formData.specs?.cpu || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specs: { ...formData.specs, cpu: parseInt(e.target.value) || 1 } 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ram">RAM (MB)</Label>
                <Input
                  id="ram"
                  type="number"
                  min="512"
                  step="512"
                  value={formData.specs?.ram || 1024}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specs: { ...formData.specs, ram: parseInt(e.target.value) || 1024 } 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  = {((formData.specs?.ram || 1024) / 1024).toFixed(1)} GB
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disk">Диск (GB)</Label>
                <Input
                  id="disk"
                  type="number"
                  min="10"
                  value={formData.specs?.disk || 20}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specs: { ...formData.specs, disk: parseInt(e.target.value) || 20 } 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bandwidth">Скорость (Mbps)</Label>
                <Input
                  id="bandwidth"
                  type="number"
                  min="10"
                  value={formData.specs?.bandwidth || 100}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specs: { ...formData.specs, bandwidth: parseInt(e.target.value) || 100 } 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipv4">IPv4 адресов</Label>
                <Input
                  id="ipv4"
                  type="number"
                  min="0"
                  value={formData.specs?.ipv4 || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specs: { ...formData.specs, ipv4: parseInt(e.target.value) || 1 } 
                  })}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="features">Функции и преимущества</Label>
              <p className="text-sm text-muted-foreground">Каждая функция с новой строки</p>
              <Textarea
                id="features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="SSD NVMe хранилище&#10;DDoS защита&#10;Бесплатные бэкапы&#10;24/7 поддержка"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Предпросмотр:</p>
              <ul className="space-y-1">
                {featuresText.split("\n").filter(f => f.trim()).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Активен</Label>
                  <p className="text-sm text-muted-foreground">
                    Тариф отображается на сайте и доступен для заказа
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Популярный</Label>
                  <p className="text-sm text-muted-foreground">
                    Показывать значок "Популярный" на карточке тарифа
                  </p>
                </div>
                <Switch
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок сортировки</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Меньшие значения отображаются первыми
                </p>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-muted-foreground">Pterodactyl интеграция</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nestId">Nest ID</Label>
                    <Input
                      id="nestId"
                      type="number"
                      value={formData.pterodactylNestId || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pterodactylNestId: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="eggId">Egg ID</Label>
                    <Input
                      id="eggId"
                      type="number"
                      value={formData.pterodactylEggId || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pterodactylEggId: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Plan Preview Component
function PlanPreview({ plan }: { plan: Plan }) {
  const typeInfo = planTypeInfo[plan.type]

  return (
    <div className="space-y-6">
      {/* Card Preview */}
      <div className={cn(
        "relative p-6 rounded-xl border-2 bg-gradient-to-br from-background to-muted/30",
        plan.isPopular && "border-yellow-500"
      )}>
        {plan.isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Популярный
            </Badge>
          </div>
        )}
        
        <div className="text-center mb-6">
          <div className={cn(
            "inline-flex p-3 rounded-xl mb-3",
            typeInfo.color,
            "text-white"
          )}>
            {typeInfo.icon}
          </div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
        
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
            <span className="text-muted-foreground">₽/мес</span>
          </div>
          {plan.priceYearly && (
            <p className="text-sm text-muted-foreground mt-1">
              или {plan.priceYearly.toLocaleString()} ₽/год (экономия {Math.round((1 - plan.priceYearly / (plan.price * 12)) * 100)}%)
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Cpu className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{plan.specs?.cpu || 1} vCPU</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Server className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{((plan.specs?.ram || 1024) / 1024).toFixed(1)} GB RAM</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{plan.specs?.disk || 20} GB SSD</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Wifi className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{plan.specs?.bandwidth || 100} Mbps</span>
          </div>
        </div>
        
        {plan.features.length > 0 && (
          <div className="space-y-2 mb-6">
            {plan.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        {plan.locations.length > 0 && (
          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Доступно в:</span>
            <div className="flex gap-1">
              {plan.locations.map((loc) => (
                <span key={loc.location.id} title={loc.location.name}>
                  {loc.location.flag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <Button className="w-full mt-4">
          Заказать сервер
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{plan._count.servers}</p>
          <p className="text-xs text-muted-foreground">Серверов</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{plan._count.orders}</p>
          <p className="text-xs text-muted-foreground">Заказов</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{(plan._count.servers * plan.price).toLocaleString()} ₽</p>
          <p className="text-xs text-muted-foreground">Доход/мес</p>
        </div>
      </div>
    </div>
  )
}
