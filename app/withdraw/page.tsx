"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Loader2,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Wallet,
  Bitcoin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RefreshCw,
} from "lucide-react"

interface WithdrawalRequest {
  id: string
  amount: number
  method: string
  details: Record<string, string>
  status: string
  adminNote?: string
  createdAt: string
  processedAt?: string
}

interface Balance {
  current: number
  pending: number
  available: number
}

export default function WithdrawPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [balance, setBalance] = useState<Balance | null>(null)

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("CARD")
  const [cardNumber, setCardNumber] = useState("")
  const [yoomoneyWallet, setYoomoneyWallet] = useState("")
  const [qiwiWallet, setQiwiWallet] = useState("")
  const [cryptoAddress, setCryptoAddress] = useState("")
  const [cryptoCurrency, setCryptoCurrency] = useState("USDT")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/withdrawals")
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setBalance(data.balance)
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitWithdrawal = async () => {
    const withdrawAmount = parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
      alert("Минимальная сумма вывода: 100 ₽")
      return
    }

    if (balance && withdrawAmount > balance.available) {
      alert("Недостаточно средств для вывода")
      return
    }

    let details: Record<string, string> = {}
    
    switch (method) {
      case "CARD":
        if (!cardNumber || cardNumber.length < 16) {
          alert("Введите корректный номер карты")
          return
        }
        details = { cardNumber: cardNumber.replace(/\s/g, "") }
        break
      case "YOOMONEY":
        if (!yoomoneyWallet) {
          alert("Введите номер кошелька ЮMoney")
          return
        }
        details = { wallet: yoomoneyWallet }
        break
      case "QIWI":
        if (!qiwiWallet) {
          alert("Введите номер телефона QIWI")
          return
        }
        details = { phone: qiwiWallet }
        break
      case "CRYPTO":
        if (!cryptoAddress) {
          alert("Введите адрес криптокошелька")
          return
        }
        details = { address: cryptoAddress, currency: cryptoCurrency }
        break
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/user/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          method,
          details,
        }),
      })

      if (res.ok) {
        setDialogOpen(false)
        loadData()
        // Reset form
        setAmount("")
        setCardNumber("")
        setYoomoneyWallet("")
        setQiwiWallet("")
        setCryptoAddress("")
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка создания заявки")
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("Ошибка отправки заявки")
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRequest = async (id: string) => {
    if (!confirm("Отменить заявку на вывод?")) return

    try {
      const res = await fetch(`/api/user/withdrawals/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка отмены")
      }
    } catch (error) {
      console.error("Cancel error:", error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getMethodIcon = (m: string) => {
    switch (m) {
      case "CARD": return <CreditCard className="h-4 w-4" />
      case "YOOMONEY": return <Wallet className="h-4 w-4" />
      case "QIWI": return <Wallet className="h-4 w-4" />
      case "CRYPTO": return <Bitcoin className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getMethodLabel = (m: string) => {
    switch (m) {
      case "CARD": return "Банковская карта"
      case "YOOMONEY": return "ЮMoney"
      case "QIWI": return "QIWI"
      case "CRYPTO": return "Криптовалюта"
      default: return m
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>
      case "PROCESSING":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />В обработке</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Выполнено</Badge>
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Отклонено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    const groups = digits.match(/.{1,4}/g)
    return groups ? groups.join(" ") : digits
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowDownLeft className="h-8 w-8" />
            Вывод средств
          </h1>
          <p className="text-muted-foreground mt-1">
            Вывод денег с баланса на банковскую карту или электронный кошелёк
          </p>
        </div>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Balance Card */}
      {balance && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Текущий баланс</p>
                <p className="text-2xl font-bold">{formatCurrency(balance.current)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ожидает вывода</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(balance.pending)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Доступно для вывода</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(balance.available)}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={() => setDialogOpen(true)} disabled={balance.available < 100}>
                <ArrowDownLeft className="h-5 w-5 mr-2" />
                Вывести средства
              </Button>
            </div>
            {balance.available < 100 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Минимальная сумма для вывода: 100 ₽
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700">Информация о выводе средств</p>
              <ul className="text-blue-600 mt-1 space-y-1 list-disc list-inside">
                <li>Минимальная сумма вывода: 100 ₽</li>
                <li>Обработка заявки: до 24 часов</li>
                <li>Комиссия: зависит от способа вывода (обычно 0-3%)</li>
                <li>Бонусные средства не подлежат выводу</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>История заявок</CardTitle>
          <CardDescription>Ваши заявки на вывод средств</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Заявок на вывод пока нет</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString("ru-RU")}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(req.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(req.method)}
                        <span>{getMethodLabel(req.method)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {req.adminNote || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelRequest(req.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Отменить
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая заявка на вывод</DialogTitle>
            <DialogDescription>
              Доступно для вывода: {balance ? formatCurrency(balance.available) : "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Сумма (₽) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Минимум 100"
                min={100}
                max={balance?.available || 0}
              />
            </div>

            <div className="space-y-2">
              <Label>Способ вывода *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Банковская карта
                    </div>
                  </SelectItem>
                  <SelectItem value="YOOMONEY">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      ЮMoney
                    </div>
                  </SelectItem>
                  <SelectItem value="QIWI">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      QIWI
                    </div>
                  </SelectItem>
                  <SelectItem value="CRYPTO">
                    <div className="flex items-center gap-2">
                      <Bitcoin className="h-4 w-4" />
                      Криптовалюта
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Method-specific fields */}
            {method === "CARD" && (
              <div className="space-y-2">
                <Label>Номер карты *</Label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>
            )}

            {method === "YOOMONEY" && (
              <div className="space-y-2">
                <Label>Номер кошелька ЮMoney *</Label>
                <Input
                  value={yoomoneyWallet}
                  onChange={(e) => setYoomoneyWallet(e.target.value)}
                  placeholder="41001..."
                />
              </div>
            )}

            {method === "QIWI" && (
              <div className="space-y-2">
                <Label>Номер телефона QIWI *</Label>
                <Input
                  value={qiwiWallet}
                  onChange={(e) => setQiwiWallet(e.target.value)}
                  placeholder="+7..."
                />
              </div>
            )}

            {method === "CRYPTO" && (
              <>
                <div className="space-y-2">
                  <Label>Криптовалюта *</Label>
                  <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT (TRC-20)</SelectItem>
                      <SelectItem value="BTC">Bitcoin</SelectItem>
                      <SelectItem value="ETH">Ethereum</SelectItem>
                      <SelectItem value="LTC">Litecoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Адрес кошелька *</Label>
                  <Input
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    placeholder="Введите адрес..."
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitWithdrawal} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Отправить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
