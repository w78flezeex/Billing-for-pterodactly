"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Shield,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Settings,
} from "lucide-react"

interface SpendingLimit {
  id: string
  monthlyLimit: number | null
  dailyLimit: number | null
  isEnabled: boolean
  alertAt: number | null
}

interface SpendingStats {
  todaySpent: number
  monthSpent: number
  todayRemaining: number | null
  monthRemaining: number | null
}

export default function SpendingLimitsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [limit, setLimit] = useState<SpendingLimit | null>(null)
  const [stats, setStats] = useState<SpendingStats | null>(null)

  // Form state
  const [isEnabled, setIsEnabled] = useState(false)
  const [monthlyLimit, setMonthlyLimit] = useState("")
  const [dailyLimit, setDailyLimit] = useState("")
  const [alertAt, setAlertAt] = useState("80")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/spending-limits")
      if (res.ok) {
        const data = await res.json()
        setLimit(data.limit)
        setStats(data.stats)
        
        if (data.limit) {
          setIsEnabled(data.limit.isEnabled)
          setMonthlyLimit(data.limit.monthlyLimit?.toString() || "")
          setDailyLimit(data.limit.dailyLimit?.toString() || "")
          setAlertAt(data.limit.alertAt?.toString() || "80")
        }
      }
    } catch (error) {
      console.error("Error loading limits:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/spending-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null,
          dailyLimit: dailyLimit ? parseFloat(dailyLimit) : null,
          alertAt: alertAt ? parseFloat(alertAt) : null,
        }),
      })

      if (res.ok) {
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка сохранения")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Ошибка сохранения настроек")
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getDayProgress = () => {
    if (!stats || !limit?.dailyLimit) return 0
    return Math.min(100, (stats.todaySpent / limit.dailyLimit) * 100)
  }

  const getMonthProgress = () => {
    if (!stats || !limit?.monthlyLimit) return 0
    return Math.min(100, (stats.monthSpent / limit.monthlyLimit) * 100)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500"
    if (progress >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Лимиты расходов
        </h1>
        <p className="text-muted-foreground mt-1">
          Контролируйте свои траты, установив дневные и месячные лимиты
        </p>
      </div>

      {/* Current Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.todaySpent)}</div>
              {limit?.dailyLimit && limit.isEnabled ? (
                <>
                  <Progress
                    value={getDayProgress()}
                    className={`h-2 mt-2 ${getProgressColor(getDayProgress())}`}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    из {formatCurrency(limit.dailyLimit)}
                    {stats.todayRemaining !== null && stats.todayRemaining > 0 && (
                      <span className="ml-2 text-green-600">
                        (осталось {formatCurrency(stats.todayRemaining)})
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Лимит не установлен</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Этот месяц
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthSpent)}</div>
              {limit?.monthlyLimit && limit.isEnabled ? (
                <>
                  <Progress
                    value={getMonthProgress()}
                    className={`h-2 mt-2 ${getProgressColor(getMonthProgress())}`}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    из {formatCurrency(limit.monthlyLimit)}
                    {stats.monthRemaining !== null && stats.monthRemaining > 0 && (
                      <span className="ml-2 text-green-600">
                        (осталось {formatCurrency(stats.monthRemaining)})
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Лимит не установлен</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки лимитов
          </CardTitle>
          <CardDescription>
            Установите ограничения на ежедневные и ежемесячные расходы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Включить лимиты расходов</Label>
              <p className="text-sm text-muted-foreground">
                При превышении лимита покупки будут заблокированы
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            {/* Daily limit */}
            <div className="space-y-2">
              <Label>Дневной лимит (₽)</Label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Например: 5000"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым, чтобы не ограничивать дневные расходы
              </p>
            </div>

            {/* Monthly limit */}
            <div className="space-y-2">
              <Label>Месячный лимит (₽)</Label>
              <Input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Например: 50000"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым, чтобы не ограничивать месячные расходы
              </p>
            </div>

            {/* Alert threshold */}
            <div className="space-y-2">
              <Label>Уведомлять при достижении (%)</Label>
              <Input
                type="number"
                value={alertAt}
                onChange={(e) => setAlertAt(e.target.value)}
                placeholder="80"
                min={10}
                max={100}
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Вы получите уведомление, когда израсходуете указанный процент от лимита
              </p>
            </div>
          </div>

          {/* Warning */}
          {isEnabled && (monthlyLimit || dailyLimit) && (
            <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Важно:</p>
                <p>При достижении лимита новые покупки (серверы, услуги) будут заблокированы до следующего периода или до изменения лимита.</p>
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
