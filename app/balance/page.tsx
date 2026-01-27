"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Wallet,
  ArrowLeft,
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  History,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string | null
  createdAt: string
}

export default function BalancePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [amount, setAmount] = useState("")
  const [promocode, setPromocode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isAuthenticated) return
      
      try {
        const res = await fetch("/api/billing/transactions")
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchTransactions()
    }
  }, [isAuthenticated, authLoading])

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError("")
    setMessage("")

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 50) {
      setError("Минимальная сумма пополнения: 50₽")
      setIsProcessing(false)
      return
    }

    if (amountNum > 100000) {
      setError("Максимальная сумма пополнения: 100 000₽")
      setIsProcessing(false)
      return
    }

    try {
      const res = await fetch("/api/billing/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      })

      const data = await res.json()

      if (res.ok && data.paymentUrl) {
        // Перенаправляем на страницу оплаты
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || "Ошибка при создании платежа")
      }
    } catch {
      setError("Ошибка подключения к серверу")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApplyPromocode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError("")
    setMessage("")

    if (!promocode.trim()) {
      setError("Введите промокод")
      setIsProcessing(false)
      return
    }

    try {
      const res = await fetch("/api/billing/promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promocode }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Промокод активирован! ${data.message || ""}`)
        setPromocode("")
        await refreshUser()
        // Обновляем транзакции
        const txRes = await fetch("/api/billing/transactions")
        if (txRes.ok) {
          const txData = await txRes.json()
          setTransactions(txData.transactions || [])
        }
      } else {
        setError(data.error || "Ошибка при активации промокода")
      }
    } catch {
      setError("Ошибка подключения к серверу")
    } finally {
      setIsProcessing(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "WITHDRAWAL":
      case "PAYMENT":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "REFUND":
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />
      case "BONUS":
      case "REFERRAL":
        return <Gift className="h-4 w-4 text-purple-500" />
      case "PROMOCODE":
        return <Tag className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Выполнено</Badge>
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />В обработке</Badge>
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ошибка</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAmount = (type: string, amount: number) => {
    const isPositive = ["DEPOSIT", "REFUND", "BONUS", "REFERRAL", "PROMOCODE"].includes(type)
    return (
      <span className={isPositive ? "text-green-600" : "text-red-600"}>
        {isPositive ? "+" : "-"}{Math.abs(amount).toFixed(2)} ₽
      </span>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Баланс и платежи</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Текущий баланс</p>
                  <p className="text-4xl font-bold">{user?.balance.toFixed(2) || "0.00"} ₽</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/referral">
                    <Button variant="outline">
                      <Gift className="h-4 w-4 mr-2" />
                      Рефералы
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Пополнить баланс
                </CardTitle>
                <CardDescription>
                  Минимальная сумма: 100₽
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTopUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сумма</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="100"
                        step="50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₽
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[100, 500, 1000, 2000, 5000].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(String(preset))}
                      >
                        {preset}₽
                      </Button>
                    ))}
                  </div>

                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Пополнить
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Promocode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Промокод
                </CardTitle>
                <CardDescription>
                  Активируйте промокод для получения бонуса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApplyPromocode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="promocode">Промокод</Label>
                    <Input
                      id="promocode"
                      placeholder="WELCOME2024"
                      value={promocode}
                      onChange={(e) => setPromocode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <Button type="submit" variant="secondary" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Активировать
                  </Button>
                </form>

                {message && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                История транзакций
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.description || tx.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatAmount(tx.type, tx.amount)}
                        </p>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>История транзакций пуста</p>
                  <p className="text-sm">Пополните баланс, чтобы начать</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
