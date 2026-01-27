"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [amount, setAmount] = useState<number | null>(null)

  useEffect(() => {
    // Обновляем данные пользователя для получения нового баланса
    const updateBalance = async () => {
      await refreshUser()
      setIsLoading(false)
    }
    
    // Небольшая задержка для обработки webhook
    setTimeout(updateBalance, 2000)
  }, [refreshUser])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-green-500/20 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {isLoading ? (
              <>
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Обработка платежа...</h1>
                  <p className="text-muted-foreground mt-2">
                    Пожалуйста, подождите
                  </p>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="p-4 bg-green-500/10 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-green-500">Платеж успешен!</h1>
                  <p className="text-muted-foreground mt-2">
                    Средства зачислены на ваш баланс
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/profile">
                    <Button className="w-full" size="lg">
                      Перейти в профиль
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/billing/topup">
                    <Button variant="outline" className="w-full">
                      Пополнить ещё
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
