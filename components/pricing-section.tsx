"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { pricingPlans } from "@/lib/config"

type ServiceType = "game" | "vps" | "web" | "dedicated"

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [serviceType, setServiceType] = useState<ServiceType>("game")
  const { t, currentLang } = useLanguage()

  const serviceTypes = [
    { id: "game" as ServiceType, name: t("gameHosting") },
    { id: "vps" as ServiceType, name: t("vpsServers") },
    { id: "web" as ServiceType, name: t("webHosting") },
    { id: "dedicated" as ServiceType, name: t("dedicatedServers") },
  ]

  return (
    <section id="pricing" className="py-20 md:py-32 bg-muted/20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("chooseSuitablePlan")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("flexiblePlans")}</p>

          {/* Service Type Selector */}
          <div className="mt-8 flex justify-center">
            <div className="flex flex-wrap justify-center gap-2 bg-muted p-1 rounded-lg">
              {serviceTypes.map((service) => (
                <Button
                  key={service.id}
                  variant={serviceType === service.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setServiceType(service.id)}
                  className="text-xs sm:text-sm"
                >
                  {service.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Billing Period Selector */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant={billingPeriod === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("monthly")}
              >
                {t("month")}
              </Button>
              <Button
                variant={billingPeriod === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("yearly")}
              >
                {t("year")}
                <Badge variant="secondary" className="ml-2">
                  -17%
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans[serviceType].map((plan, index) => (
            <motion.div
              key={`${serviceType}-${plan.name}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${plan.popular ? "border-primary shadow-lg" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">{t("popular")}</Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground">{plan.description[currentLang]}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price[billingPeriod]}₽</span>
                    <span className="text-muted-foreground">
                      /{billingPeriod === "monthly" ? t("monthShort") : t("yearShort")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features[currentLang].map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                    {t("choosePlan")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
