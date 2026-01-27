"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Loader2, 
  CheckCircle,
  Shield,
  Zap,
  Globe,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

interface PaymentMethod {
  provider: string
  name: string
  enabled: boolean
  currencies: string[]
}

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000]

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  yookassa: <CreditCard className="h-5 w-5" />,
  stripe: <CreditCard className="h-5 w-5" />,
  paypal: <Wallet className="h-5 w-5" />,
  cryptopay: <Bitcoin className="h-5 w-5" />,
}

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  yookassa: "Банковские карты РФ, ЮMoney, SberPay",
  stripe: "Visa, Mastercard, Apple Pay, Google Pay",
  paypal: "PayPal кошелек",
  cryptopay: "USDT, BTC, ETH, TON и другие",
}

export default function TopUpPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [amount, setAmount] = useState<string>("500")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/billing/payment")
      const data = await res.json()
      setMethods(data.methods || [])
      
      // Выбираем первый доступный метод
      const enabledMethod = data.methods?.find((m: PaymentMethod) => m.enabled)
      if (enabledMethod) {
        setSelectedProvider(enabledMethod.provider)
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const finalAmount = customAmount ? parseFloat(customAmount) : parseFloat(amount)

    if (!finalAmount || finalAmount < 10) {
      setError("Минимальная сумма пополнения: 10 ₽")
      setIsLoading(false)
      return
    }

    if (finalAmount > 1000000) {
      setError("Максимальная сумма пополнения: 1,000,000 ₽")
      setIsLoading(false)
      return
    }

    if (!selectedProvider) {
      setError("Выберите способ оплаты")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/billing/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          amount: finalAmount,
        }),
      })

      const data = await res.json()

      if (res.ok && data.paymentUrl) {
        // Перенаправляем на страницу оплаты
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || "Ошибка создания платежа")
      }
    } catch (error) {
      setError("Ошибка соединения")
    }

    setIsLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedMethod = methods.find(m => m.provider === selectedProvider)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Пополнение баланса</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Текущий баланс: <span className="font-semibold text-foreground">{user?.balance?.toFixed(2) || "0.00"} ₽</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Форма пополнения */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Выберите сумму и способ оплаты</CardTitle>
                  <CardDescription>
                    Средства будут зачислены на баланс мгновенно после оплаты
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Сумма */}
                    <div className="space-y-3">
                      <Label>Сумма пополнения</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {PRESET_AMOUNTS.map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant={amount === preset.toString() && !customAmount ? "default" : "outline"}
                            onClick={() => {
                              setAmount(preset.toString())
                              setCustomAmount("")
                            }}
                            className="h-12"
                          >
                            {preset.toLocaleString()} ₽
                          </Button>
                        ))}
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Своя сумма"
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value)
                            setAmount("")
                          }}
                          min={10}
                          max={1000000}
                          className="h-12 text-lg"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₽
                        </span>
                      </div>
                    </div>

                    {/* Способ оплаты */}
                    <div className="space-y-3">
                      <Label>Способ оплаты</Label>
                      <RadioGroup
                        value={selectedProvider}
                        onValueChange={setSelectedProvider}
                        className="space-y-3"
                      >
                        {methods.map((method) => (
                          <div key={method.provider}>
                            <RadioGroupItem
                              value={method.provider}
                              id={method.provider}
                              disabled={!method.enabled}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={method.provider}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                                ${selectedProvider === method.provider ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                                ${!method.enabled ? "opacity-50 cursor-not-allowed" : ""}
                              `}
                            >
                              <div className={`p-2 rounded-lg ${selectedProvider === method.provider ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                {PROVIDER_ICONS[method.provider]}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {PROVIDER_DESCRIPTIONS[method.provider]}
                                </div>
                              </div>
                              {method.currencies.length > 0 && (
                                <div className="flex gap-1">
                                  {method.currencies.slice(0, 3).map((curr) => (
                                    <Badge key={curr} variant="secondary" className="text-xs">
                                      {curr}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {!method.enabled && (
                                <Badge variant="outline">Скоро</Badge>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12"
                      disabled={isLoading || !selectedProvider}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание платежа...
                        </>
                      ) : (
                        <>
                          Пополнить на {(customAmount || amount || "0").toLocaleString()} ₽
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Информация */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Преимущества</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Мгновенное зачисление</div>
                      <div className="text-xs text-muted-foreground">
                        Средства появятся на балансе сразу после оплаты
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Безопасность</div>
                      <div className="text-xs text-muted-foreground">
                        Все платежи защищены SSL шифрованием
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Любой метод</div>
                      <div className="text-xs text-muted-foreground">
                        Карты, электронные кошельки, криптовалюта
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Итого к оплате</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {parseFloat(customAmount || amount || "0").toLocaleString()} ₽
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Без комиссии
                  </div>
                  {selectedMethod && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">Оплата через</div>
                      <div className="font-medium">{selectedMethod.name}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
