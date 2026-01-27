"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  Shield,
  Lock,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react"

export default function TestPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transactionId")
  const amount = searchParams.get("amount")
  
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<"form" | "3ds" | "success" | "failed">("form")
  const [countdown, setCountdown] = useState(3)

  // Форматирование номера карты
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(" ") : v
  }

  // Форматирование срока действия
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Обработка оплаты
  const handlePayment = async () => {
    if (!transactionId) return

    setProcessing(true)

    // Имитация задержки обработки
    await new Promise((r) => setTimeout(r, 1500))

    // Переход на 3DS
    setStep("3ds")
    
    // Имитация 3DS проверки
    await new Promise((r) => setTimeout(r, 2000))

    // Обрабатываем платёж на сервере
    try {
      const res = await fetch("/api/billing/test-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          success: true, // В тестовом режиме всегда успех
        }),
      })

      if (res.ok) {
        setStep("success")
        // Обратный отсчёт перед редиректом
        let count = 3
        const interval = setInterval(() => {
          count--
          setCountdown(count)
          if (count <= 0) {
            clearInterval(interval)
            router.push(`/billing/success?transactionId=${transactionId}`)
          }
        }, 1000)
      } else {
        setStep("failed")
      }
    } catch (error) {
      setStep("failed")
    }

    setProcessing(false)
  }

  if (!transactionId || !amount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">Ошибка: неверные параметры платежа</p>
            <Button className="mt-4" onClick={() => router.push("/billing")}>
              Вернуться
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Форма оплаты */}
        {step === "form" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-3 w-3" />
                  Безопасное соединение
                </div>
              </div>
              <div className="text-center pt-4">
                <CardTitle className="text-2xl text-white">Оплата</CardTitle>
                <CardDescription className="text-slate-400">
                  Пополнение баланса
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Сумма */}
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">К оплате</p>
                <p className="text-3xl font-bold text-white">{amount} ₽</p>
              </div>

              {/* Выбор метода оплаты */}
              <div className="space-y-3">
                <Label className="text-slate-300">Способ оплаты</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="card"
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" className="sr-only" />
                    <CreditCard className="h-5 w-5 text-slate-300" />
                    <span className="text-sm text-slate-300">Банковская карта</span>
                  </Label>
                  <Label
                    htmlFor="sbp"
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "sbp"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem value="sbp" id="sbp" className="sr-only" />
                    <Smartphone className="h-5 w-5 text-slate-300" />
                    <span className="text-sm text-slate-300">СБП</span>
                  </Label>
                  <Label
                    htmlFor="wallet"
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "wallet"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem value="wallet" id="wallet" className="sr-only" />
                    <Wallet className="h-5 w-5 text-slate-300" />
                    <span className="text-sm text-slate-300">ЮMoney</span>
                  </Label>
                  <Label
                    htmlFor="bank"
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === "bank"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem value="bank" id="bank" className="sr-only" />
                    <Building2 className="h-5 w-5 text-slate-300" />
                    <span className="text-sm text-slate-300">Счёт в банке</span>
                  </Label>
                </RadioGroup>
              </div>

              <Separator className="bg-slate-700" />

              {/* Форма карты */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-slate-300">
                      Номер карты
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-lg tracking-widest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="text-slate-300">
                        Срок действия
                      </Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-slate-300">
                        CVV/CVC
                      </Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        maxLength={3}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holder" className="text-slate-300">
                      Имя владельца
                    </Label>
                    <Input
                      id="holder"
                      placeholder="IVAN IVANOV"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 uppercase"
                    />
                  </div>
                </div>
              )}

              {/* СБП */}
              {paymentMethod === "sbp" && (
                <div className="text-center py-8">
                  <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                        <span className="text-slate-500 text-xs">QR-код</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Отсканируйте QR-код в приложении вашего банка
                  </p>
                </div>
              )}

              {/* Кошелёк */}
              {(paymentMethod === "wallet" || paymentMethod === "bank") && (
                <div className="text-center py-8 text-slate-400">
                  <p>Вы будете перенаправлены на страницу оплаты</p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={processing || (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCvv))}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>Оплатить {amount} ₽</>
                )}
              </Button>

              {/* Безопасность */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>PCI DSS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>3D Secure</span>
                </div>
              </div>

              {/* Тестовый режим */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                <p className="text-amber-500 text-xs">
                  ⚠️ Тестовый режим. Деньги не списываются.
                </p>
                <p className="text-amber-500/70 text-xs mt-1">
                  Тестовая карта: 4111 1111 1111 1111, срок: 12/25, CVV: 123
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3D Secure */}
        {step === "3ds" && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Подтверждение платежа</h2>
                <p className="text-slate-400 mt-2">
                  Проверка 3D Secure...
                </p>
              </div>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-slate-500 text-sm mt-4">
                Не закрывайте это окно
              </p>
            </CardContent>
          </Card>
        )}

        {/* Успех */}
        {step === "success" && (
          <Card className="border-green-500/30 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-green-500">Оплата успешна!</h2>
              <p className="text-slate-400 mt-2">
                Средства зачислены на ваш баланс
              </p>
              <p className="text-3xl font-bold text-white mt-4">+{amount} ₽</p>
              <p className="text-slate-500 text-sm mt-6">
                Переход через {countdown} сек...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ошибка */}
        {step === "failed" && (
          <Card className="border-red-500/30 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold text-red-500">Ошибка оплаты</h2>
              <p className="text-slate-400 mt-2">
                Платёж не был выполнен
              </p>
              <Button
                onClick={() => setStep("form")}
                className="mt-6"
                variant="outline"
              >
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
