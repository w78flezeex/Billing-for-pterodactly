"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Loader2,
  Save,
  CreditCard,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

interface PaymentSettings {
  testMode: boolean
  minAmount: number
  maxAmount: number
  yookassaEnabled: boolean
  manualPaymentEnabled: boolean
}

export default function PaymentSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PaymentSettings>({
    testMode: true,
    minAmount: 50,
    maxAmount: 100000,
    yookassaEnabled: false,
    manualPaymentEnabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/payments")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success("Настройки сохранены")
      } else {
        toast.error("Ошибка сохранения")
      }
    } catch (error) {
      toast.error("Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Настройки платежей</h1>
              <p className="text-muted-foreground">Управление платёжной системой</p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Режим работы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Режим работы
              </CardTitle>
              <CardDescription>
                Включите тестовый режим для проверки платежей без реальных денег
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="testMode" className="text-base font-medium">
                      Тестовый режим
                    </Label>
                    {settings.testMode ? (
                      <Badge variant="secondary">
                        <TestTube className="h-3 w-3 mr-1" />
                        Тест
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Боевой
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {settings.testMode
                      ? "Платежи обрабатываются локально, деньги не списываются"
                      : "Реальные платежи через YooKassa"}
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={settings.testMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, testMode: checked })
                  }
                />
              </div>

              {settings.testMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Тестовый режим активен</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Все платежи будут обрабатываться через тестовую страницу.
                        Баланс пополняется без реального списания средств.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Тестовая карта: <code className="bg-muted px-1 rounded">4111 1111 1111 1111</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!settings.testMode && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-500">Боевой режим</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Платежи обрабатываются через YooKassa.
                        Убедитесь что API ключи настроены в .env файле.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Лимиты */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Лимиты пополнения
              </CardTitle>
              <CardDescription>
                Минимальная и максимальная сумма пополнения баланса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Минимум (₽)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={settings.minAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minAmount: parseInt(e.target.value) || 50,
                      })
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Максимум (₽)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={settings.maxAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxAmount: parseInt(e.target.value) || 100000,
                      })
                    }
                    min={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Способы оплаты */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Способы оплаты
              </CardTitle>
              <CardDescription>
                Включите или отключите доступные способы оплаты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">YooKassa (ЮKassa)</Label>
                  <p className="text-sm text-muted-foreground">
                    Банковские карты, СБП, электронные кошельки
                  </p>
                </div>
                <Switch
                  checked={settings.yookassaEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, yookassaEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Ручное пополнение</Label>
                  <p className="text-sm text-muted-foreground">
                    Пополнение через администратора (перевод на карту и т.д.)
                  </p>
                </div>
                <Switch
                  checked={settings.manualPaymentEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, manualPaymentEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Инструкция */}
          <Card>
            <CardHeader>
              <CardTitle>Настройка YooKassa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Для подключения реальных платежей через YooKassa:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Зарегистрируйтесь на <a href="https://yookassa.ru" target="_blank" className="text-primary hover:underline">yookassa.ru</a></li>
                <li>Получите Shop ID и Secret Key в личном кабинете</li>
                <li>Добавьте их в файл <code className="bg-muted px-1 rounded">.env</code>:
                  <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
{`YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key`}
                  </pre>
                </li>
                <li>Настройте webhook в кабинете YooKassa:
                  <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
{`URL: https://ваш-домен.ru/api/billing/webhook/yookassa
События: payment.succeeded, payment.canceled`}
                  </pre>
                </li>
                <li>Выключите тестовый режим выше</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
