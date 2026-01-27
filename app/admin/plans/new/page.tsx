"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  Save,
} from "lucide-react"

interface PterodactylNest {
  id: number
  name: string
  description: string
}

interface PterodactylEgg {
  id: number
  name: string
  description: string
  dockerImage: string
}

interface Location {
  id: string
  name: string
  country: string
  city: string
  flag: string
}

const PLAN_TYPES = [
  { value: "GAME_HOSTING", label: "Игровой хостинг", icon: Server },
  { value: "VPS", label: "VPS сервер", icon: Cpu },
  { value: "WEB_HOSTING", label: "Веб хостинг", icon: Zap },
  { value: "DEDICATED", label: "Выделенный сервер", icon: HardDrive },
]

export default function NewPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("GAME_HOSTING")
  const [price, setPrice] = useState("")
  const [priceYearly, setPriceYearly] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isPopular, setIsPopular] = useState(false)
  const [sortOrder, setSortOrder] = useState("0")
  
  // Specs
  const [ram, setRam] = useState("2048") // MB
  const [cpu, setCpu] = useState("100") // %
  const [disk, setDisk] = useState("10240") // MB
  const [swap, setSwap] = useState("0") // MB
  const [backups, setBackups] = useState("2")
  const [databases, setDatabases] = useState("0")
  const [allocations, setAllocations] = useState("1")
  
  // Features
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  
  // Pterodactyl
  const [nests, setNests] = useState<PterodactylNest[]>([])
  const [eggs, setEggs] = useState<PterodactylEgg[]>([])
  const [selectedNestId, setSelectedNestId] = useState<string>("")
  const [selectedEggId, setSelectedEggId] = useState<string>("")
  const [loadingEggs, setLoadingEggs] = useState(false)
  
  // Locations
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedNestId) {
      loadEggs(selectedNestId)
    } else {
      setEggs([])
      setSelectedEggId("")
    }
  }, [selectedNestId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load Pterodactyl data
      const pteroRes = await fetch("/api/admin/pterodactyl?type=nests")
      if (pteroRes.ok) {
        const pteroData = await pteroRes.json()
        setNests(pteroData.nests || [])
      }
      
      // Load locations
      const locRes = await fetch("/api/admin/settings")
      if (locRes.ok) {
        const locData = await locRes.json()
        setLocations(locData.locations || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEggs = async (nestId: string) => {
    setLoadingEggs(true)
    try {
      const res = await fetch(`/api/admin/pterodactyl?type=eggs&nestId=${nestId}`)
      if (res.ok) {
        const data = await res.json()
        setEggs(data.eggs || [])
      }
    } catch (error) {
      console.error("Error loading eggs:", error)
    } finally {
      setLoadingEggs(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature))
  }

  const toggleLocation = (locationId: string) => {
    if (selectedLocations.includes(locationId)) {
      setSelectedLocations(selectedLocations.filter(id => id !== locationId))
    } else {
      setSelectedLocations([...selectedLocations, locationId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price || !type) {
      alert("Заполните обязательные поля")
      return
    }

    setSaving(true)
    try {
      const specs = {
        ram: parseInt(ram),
        cpu: parseInt(cpu),
        disk: parseInt(disk),
        swap: parseInt(swap),
        backups: parseInt(backups),
        databases: parseInt(databases),
        allocations: parseInt(allocations),
      }

      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type,
          price: parseFloat(price),
          priceYearly: priceYearly ? parseFloat(priceYearly) : null,
          isActive,
          isPopular,
          sortOrder: parseInt(sortOrder),
          features,
          specs,
          pterodactylNestId: selectedNestId || null,
          pterodactylEggId: selectedEggId || null,
          locationIds: selectedLocations,
        }),
      })

      if (res.ok) {
        router.push("/admin?tab=settings")
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка при создании тарифа")
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      alert("Ошибка при создании тарифа")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-10">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Новый тариф</h1>
              <p className="text-muted-foreground">Создание тарифного плана</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название и тип тарифа</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                      id="name"
                      placeholder="Starter"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип тарифа *</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              {t.label}
                            </div>
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
                    placeholder="Описание тарифа..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (₽/мес) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="199"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priceYearly">Цена (₽/год)</Label>
                    <Input
                      id="priceYearly"
                      type="number"
                      step="0.01"
                      placeholder="1990 (скидка)"
                      value={priceYearly}
                      onChange={(e) => setPriceYearly(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Порядок сортировки</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      placeholder="0"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive">Активен</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPopular"
                      checked={isPopular}
                      onCheckedChange={setIsPopular}
                    />
                    <Label htmlFor="isPopular">Популярный</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Характеристики сервера
                </CardTitle>
                <CardDescription>Ресурсы выделяемые для сервера</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ram">
                      <MemoryStick className="inline h-4 w-4 mr-1" />
                      RAM (MB)
                    </Label>
                    <Input
                      id="ram"
                      type="number"
                      placeholder="2048"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{(parseInt(ram) / 1024).toFixed(1)} GB</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpu">
                      <Cpu className="inline h-4 w-4 mr-1" />
                      CPU (%)
                    </Label>
                    <Input
                      id="cpu"
                      type="number"
                      placeholder="100"
                      value={cpu}
                      onChange={(e) => setCpu(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{(parseInt(cpu) / 100).toFixed(1)} ядер</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disk">
                      <HardDrive className="inline h-4 w-4 mr-1" />
                      Диск (MB)
                    </Label>
                    <Input
                      id="disk"
                      type="number"
                      placeholder="10240"
                      value={disk}
                      onChange={(e) => setDisk(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{(parseInt(disk) / 1024).toFixed(1)} GB</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="swap">Swap (MB)</Label>
                    <Input
                      id="swap"
                      type="number"
                      placeholder="0"
                      value={swap}
                      onChange={(e) => setSwap(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backups">Бэкапы</Label>
                    <Input
                      id="backups"
                      type="number"
                      placeholder="2"
                      value={backups}
                      onChange={(e) => setBackups(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="databases">Базы данных</Label>
                    <Input
                      id="databases"
                      type="number"
                      placeholder="0"
                      value={databases}
                      onChange={(e) => setDatabases(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="allocations">Порты</Label>
                    <Input
                      id="allocations"
                      type="number"
                      placeholder="1"
                      value={allocations}
                      onChange={(e) => setAllocations(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pterodactyl */}
            {type === "GAME_HOSTING" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Pterodactyl (Ядро игры)
                  </CardTitle>
                  <CardDescription>Выберите игровое ядро из Pterodactyl Panel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nest (Категория)</Label>
                      <Select value={selectedNestId} onValueChange={setSelectedNestId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {nests.filter(n => n.id != null).map((nest) => (
                            <SelectItem key={nest.id} value={String(nest.id)}>
                              {nest.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Egg (Ядро)</Label>
                      <Select 
                        value={selectedEggId} 
                        onValueChange={setSelectedEggId}
                        disabled={!selectedNestId || loadingEggs}
                      >
                        <SelectTrigger>
                          {loadingEggs ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Выберите ядро" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {eggs.filter(e => e.id != null).map((egg) => (
                            <SelectItem key={egg.id} value={String(egg.id)}>
                              {egg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedEggId && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {eggs.find(e => e.id.toString() === selectedEggId)?.description || "Нет описания"}
                      </p>
                    </div>
                  )}
                  
                  {nests.length === 0 && (
                    <p className="text-sm text-amber-500">
                      Не удалось загрузить данные из Pterodactyl. Проверьте настройки API.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Преимущества</CardTitle>
                <CardDescription>Список преимуществ для отображения клиентам</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Добавить преимущество..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="px-3 py-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {features.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Нет добавленных преимуществ
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Локации</CardTitle>
                <CardDescription>Выберите локации где будет доступен этот тариф</CardDescription>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нет доступных локаций. Сначала создайте локации.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedLocations.includes(location.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => toggleLocation(location.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedLocations.includes(location.id)}
                            onCheckedChange={() => toggleLocation(location.id)}
                          />
                          <span className="text-xl">{location.flag}</span>
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {location.city}, {location.country}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Создать тариф
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
