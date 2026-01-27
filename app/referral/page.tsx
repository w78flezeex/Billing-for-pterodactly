"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  Copy,
  Check,
  Gift,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Wallet,
  TrendingUp,
  Share2,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

interface Referral {
  id: string
  name: string
  createdAt: string
}

interface ReferralInfo {
  referralCode: string
  referralLink: string
  referralBalance: number
  totalReferrals: number
  referrals: Referral[]
  referredBy: { id: string; name: string } | null
}

export default function ReferralPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchReferralInfo = async () => {
      if (!isAuthenticated) return
      
      try {
        const res = await fetch("/api/user/referral")
        if (res.ok) {
          const data = await res.json()
          setReferralInfo(data)
        }
      } catch (error) {
        console.error("Error fetching referral info:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchReferralInfo()
    }
  }, [isAuthenticated, authLoading])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const regenerateCode = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch("/api/user/referral", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setReferralInfo(prev => prev ? {
          ...prev,
          referralCode: data.referralCode,
          referralLink: data.referralLink,
        } : null)
      }
    } catch (error) {
      console.error("Error regenerating code:", error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const shareLink = async () => {
    if (!referralInfo) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Приглашение в хостинг",
          text: "Зарегистрируйся по моей ссылке и получи бонус!",
          url: referralInfo.referralLink,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyToClipboard(referralInfo.referralLink)
    }
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
            <h1 className="text-xl font-bold">Реферальная программа</h1>
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
          {/* Hero Banner */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Приглашай друзей — получай бонусы!</h2>
                  <p className="text-muted-foreground">
                    Получай 10% от первого платежа каждого приглашённого друга. 
                    Минимум 50₽, максимум 500₽ за каждого реферала.
                  </p>
                </div>
                <Gift className="h-24 w-24 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Реферальный баланс</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {referralInfo?.referralBalance.toFixed(2) || "0.00"} ₽
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Доступно для вывода на баланс
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Приглашено друзей</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {referralInfo?.totalReferrals || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего зарегистрировано по вашей ссылке
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Заработано всего</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {((referralInfo?.totalReferrals || 0) * 50).toFixed(2)} ₽
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  За всё время
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card>
            <CardHeader>
              <CardTitle>Ваша реферальная ссылка</CardTitle>
              <CardDescription>
                Поделитесь этой ссылкой с друзьями
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralInfo?.referralLink || ""}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralInfo?.referralLink || "")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={shareLink}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Ваш код:</span>
                  <Badge variant="secondary" className="font-mono">
                    {referralInfo?.referralCode || "..."}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerateCode}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Новый код
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card>
            <CardHeader>
              <CardTitle>Приглашённые пользователи</CardTitle>
              <CardDescription>
                Список зарегистрированных по вашей ссылке
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralInfo?.referrals && referralInfo.referrals.length > 0 ? (
                <div className="space-y-3">
                  {referralInfo.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(referral.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +50₽
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Пока нет приглашённых пользователей</p>
                  <p className="text-sm">Поделитесь ссылкой с друзьями!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle>Как это работает?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">1. Поделитесь ссылкой</h3>
                  <p className="text-sm text-muted-foreground">
                    Отправьте реферальную ссылку друзьям
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">2. Друг регистрируется</h3>
                  <p className="text-sm text-muted-foreground">
                    И совершает первый платёж
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">3. Получите бонус</h3>
                  <p className="text-sm text-muted-foreground">
                    10% от платежа зачисляется вам
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
