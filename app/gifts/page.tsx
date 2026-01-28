"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { 
  Gift, 
  Send, 
  Inbox, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  Check,
  X,
  Trash2,
  AlertCircle
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BalanceGift {
  id: string
  senderId: string
  recipientId?: string
  recipientEmail: string
  amount: number
  message?: string
  status: "PENDING" | "CLAIMED" | "EXPIRED" | "CANCELLED"
  claimedAt?: string
  expiresAt?: string
  createdAt: string
}

export default function GiftsPage() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sentGifts, setSentGifts] = useState<BalanceGift[]>([])
  const [receivedGifts, setReceivedGifts] = useState<BalanceGift[]>([])
  
  const [recipientEmail, setRecipientEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchGifts()
  }, [])

  const fetchGifts = async () => {
    try {
      const res = await fetch("/api/gifts")
      const data = await res.json()
      if (data.sent) setSentGifts(data.sent)
      if (data.received) setReceivedGifts(data.received)
    } catch (error) {
      console.error("Error fetching gifts:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendGift = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          amount: parseFloat(amount),
          message: message || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Ошибка отправки")
        return
      }

      toast.success(
        data.recipientFound 
          ? "Подарок отправлен и получен!" 
          : "Подарок отправлен! Получатель получит его при регистрации."
      )

      setRecipientEmail("")
      setAmount("")
      setMessage("")
      fetchGifts()
      refreshUser()
    } catch {
      toast.error("Ошибка подключения")
    } finally {
      setSending(false)
    }
  }

  const cancelGift = async (giftId: string) => {
    try {
      const res = await fetch("/api/gifts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId }),
      })

      if (res.ok) {
        toast.success("Подарок отменён, средства возвращены")
        fetchGifts()
        refreshUser()
      } else {
        const data = await res.json()
        toast.error(data.error || "Ошибка отмены")
      }
    } catch {
      toast.error("Ошибка подключения")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Ожидает</Badge>
      case "CLAIMED":
        return <Badge className="gap-1 bg-green-500"><Check className="h-3 w-3" /> Получен</Badge>
      case "EXPIRED":
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Истёк</Badge>
      case "CANCELLED":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Отменён</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const quickAmounts = [100, 500, 1000, 5000]

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          Подарки
        </h1>
        <p className="text-muted-foreground mt-2">
          Отправляйте баланс друзьям и коллегам
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Форма отправки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Отправить подарок
            </CardTitle>
            <CardDescription>
              Ваш баланс: <span className="font-bold text-foreground">{user?.balance?.toFixed(2) || 0} ₽</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendGift} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email получателя</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Сумма</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="100000"
                  step="0.01"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((a) => (
                    <Button
                      key={a}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(a.toString())}
                    >
                      {a} ₽
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Сообщение (опционально)</Label>
                <Textarea
                  id="message"
                  placeholder="С днём рождения! 🎂"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={sending || !recipientEmail || !amount}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                Отправить подарок
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Информация */}
        <Card>
          <CardHeader>
            <CardTitle>Как это работает?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Укажите email</p>
                <p className="text-sm text-muted-foreground">
                  Введите email друга или коллеги
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Выберите сумму</p>
                <p className="text-sm text-muted-foreground">
                  От 10 до 100,000 ₽
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Мгновенная доставка</p>
                <p className="text-sm text-muted-foreground">
                  Если получатель зарегистрирован — деньги поступят сразу
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 mt-4">
              <p className="text-sm">
                <strong>💡 Совет:</strong> Если получатель ещё не зарегистрирован, 
                подарок будет ждать его 30 дней. Вы можете отменить неполученный подарок.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* История подарков */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>История подарков</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sent">
            <TabsList className="mb-4">
              <TabsTrigger value="sent" className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Отправленные ({sentGifts.length})
              </TabsTrigger>
              <TabsTrigger value="received" className="gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Полученные ({receivedGifts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sentGifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Вы ещё не отправляли подарки</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{gift.recipientEmail}</span>
                          {getStatusBadge(gift.status)}
                        </div>
                        {gift.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            "{gift.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(gift.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">
                          -{gift.amount.toFixed(2)} ₽
                        </span>
                        {gift.status === "PENDING" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Отменить подарок?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Средства вернутся на ваш баланс. Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Нет</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelGift(gift.id)}>
                                  Да, отменить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : receivedGifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>У вас пока нет полученных подарков</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Подарок</span>
                          {getStatusBadge(gift.status)}
                        </div>
                        {gift.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            "{gift.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(gift.createdAt)}
                        </p>
                      </div>
                      <span className="font-bold text-lg text-green-500">
                        +{gift.amount.toFixed(2)} ₽
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
