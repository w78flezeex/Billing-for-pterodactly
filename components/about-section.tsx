"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Shield, Zap, Headphones, Server, Globe, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"

export function AboutSection() {
  const { t, isLoaded } = useLanguage()

  const features = [
    {
      icon: Server,
      title: t("powerfulInfrastructure"),
      description: t("powerfulInfrastructureDesc"),
    },
    {
      icon: Zap,
      title: t("pterodactylPanel"),
      description: t("pterodactylPanelDesc"),
    },
    {
      icon: Shield,
      title: t("ddosProtection"),
      description: t("ddosProtectionDesc"),
    },
    {
      icon: Headphones,
      title: t("support247"),
      description: t("support247Desc"),
    },
    {
      icon: Globe,
      title: t("globalNetwork"),
      description: t("globalNetworkDesc"),
    },
    {
      icon: Lock,
      title: t("dataSecurity"),
      description: t("dataSecurityDesc"),
    },
  ]

  // Показываем загрузку пока язык не загружен
  if (!isLoaded) {
    return (
      <section id="about" className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="h-10 bg-muted animate-pulse rounded mb-4"></div>
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="about" className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("whyChooseUs")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("aboutDescription")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
