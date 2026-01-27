"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Server, 
  MapPin, 
  Cpu, 
  HardDrive, 
  MemoryStick,
  Check,
  Loader2,
  Tag,
  ArrowRight
} from "lucide-react"

interface Location {
  id: string
  name: string
  country: string
  flag: string
  isActive: boolean
}

interface Plan {
  id: string
  name: string
  description?: string
  cpu: number
  ram: number
  disk: number
  price: number
  features: string[]
  isPopular?: boolean
  locations: {
    location: Location
    priceModifier: number
    isAvailable: boolean
  }[]
}

export default function OrderPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState("")
  
  // Выбор
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [hostname, setHostname] = useState("")
  const [promocode, setPromocode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [promoError, setPromoError] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)

  useEffect(() => {
    fetchPlansAndLocations()
  }, [])

  const fetchPlansAndLocations = async () => {
    try {
      const res = await fetch("/api/plans")
      const data = await res.json()
      setPlans(data.plans || [])
      setLocations(data.locations || [])
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkPromocode = async () => {
    if (!promocode.trim()) return
    
    setPromoLoading(true)
    setPromoError("")
    setPromoDiscount(0)
    
    try {
      const res = await fetch(`/api/billing/promocode?code=${promocode}`)
      const data = await res.json()
      
      if (data.valid) {
        setPromoDiscount(data.promocode.discountValue)
        setPromoError("")
      } else {
        setPromoError(data.error || "Промокод недействителен")
      }
    } catch (error) {
      setPromoError("Ошибка проверки промокода")
    } finally {
      setPromoLoading(false)
    }
  }

  const calculateFinalPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return 0
    
    const planLocation = plan.locations.find(l => l.location.id === selectedLocation)
    const priceModifier = planLocation?.priceModifier || 1
    
    let price = plan.price * priceModifier
    
    if (promoDiscount > 0) {
      price = price * (1 - promoDiscount / 100)
    }
    
    return Math.round(price * 100) / 100
  }

  const handleOrder = async () => {
    if (!selectedPlan || !selectedLocation) {
      setError("Выберите тариф и локацию")
      return
    }

    setOrdering(true)
    setError("")

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          locationId: selectedLocation,
          hostname: hostname || undefined,
          promocode: promocode || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/profile?tab=servers&new=${data.server.id}`)
      } else {
        setError(data.error || "Ошибка при заказе")
      }
    } catch (error) {
      setError("Ошибка при отправке запроса")
    } finally {
      setOrdering(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const availableLocations = selectedPlanData?.locations.filter(l => l.isAvailable) || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Заказать сервер</h1>
          <p className="text-muted-foreground text-lg">
            Выберите подходящий тариф и локацию для вашего проекта
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Выбор тарифа */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Шаг 1: Выберите тариф
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                  <div className="grid md:grid-cols-2 gap-4">
                    {plans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Label
                          htmlFor={plan.id}
                          className={`block cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                            selectedPlan === plan.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value={plan.id} id={plan.id} />
                              <span className="font-semibold">{plan.name}</span>
                            </div>
                            {plan.isPopular && (
                              <Badge variant="default">Популярный</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Cpu className="h-4 w-4" />
                              <span>{plan.cpu}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MemoryStick className="h-4 w-4" />
                              <span>{plan.ram} GB</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <HardDrive className="h-4 w-4" />
                              <span>{plan.disk} GB</span>
                            </div>
                          </div>

                          {plan.features?.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                              {plan.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="text-xl font-bold text-primary">
                            {plan.price} ₽<span className="text-sm font-normal text-muted-foreground">/мес</span>
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Выбор локации */}
            <Card className={!selectedPlan ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Шаг 2: Выберите локацию
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlan && availableLocations.length > 0 ? (
                  <RadioGroup value={selectedLocation} onValueChange={setSelectedLocation}>
                    <div className="grid md:grid-cols-2 gap-4">
                      {availableLocations.map((pl) => (
                        <Label
                          key={pl.location.id}
                          htmlFor={pl.location.id}
                          className={`flex items-center gap-4 cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                            selectedLocation === pl.location.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={pl.location.id} id={pl.location.id} />
                          <div className="text-2xl">{pl.location.flag}</div>
                          <div className="flex-1">
                            <div className="font-medium">{pl.location.name}</div>
                            <div className="text-sm text-muted-foreground">{pl.location.country}</div>
                          </div>
                          {pl.priceModifier !== 1 && (
                            <Badge variant="outline">
                              {pl.priceModifier > 1 ? "+" : ""}{Math.round((pl.priceModifier - 1) * 100)}%
                            </Badge>
                          )}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                ) : selectedPlan ? (
                  <p className="text-muted-foreground text-center py-4">
                    Нет доступных локаций для этого тарифа
                  </p>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Сначала выберите тариф
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Дополнительные настройки */}
            <Card className={!selectedLocation ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>Шаг 3: Дополнительно</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Имя сервера (необязательно)</Label>
                  <Input
                    id="hostname"
                    placeholder="my-minecraft-server"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promocode">Промокод</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promocode"
                      placeholder="Введите промокод"
                      value={promocode}
                      onChange={(e) => {
                        setPromocode(e.target.value.toUpperCase())
                        setPromoDiscount(0)
                        setPromoError("")
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={checkPromocode}
                      disabled={promoLoading || !promocode}
                    >
                      {promoLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-destructive">{promoError}</p>
                  )}
                  {promoDiscount > 0 && (
                    <p className="text-sm text-green-500">
                      ✓ Скидка {promoDiscount}% применена
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Итого */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Тариф:</span>
                      <span className="font-medium">{selectedPlanData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU:</span>
                      <span>{selectedPlanData.cpu}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RAM:</span>
                      <span>{selectedPlanData.ram} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Диск:</span>
                      <span>{selectedPlanData.disk} GB</span>
                    </div>
                    {selectedLocation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Локация:</span>
                        <span>
                          {availableLocations.find(l => l.location.id === selectedLocation)?.location.name}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-4">
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-500 mb-2">
                          <span>Скидка:</span>
                          <span>-{promoDiscount}%</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                        <span>Итого:</span>
                        <span className="text-primary">{calculateFinalPrice()} ₽/мес</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Выберите тариф для расчета стоимости
                  </p>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedPlan || !selectedLocation || ordering}
                  onClick={handleOrder}
                >
                  {ordering ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Заказать сервер
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
