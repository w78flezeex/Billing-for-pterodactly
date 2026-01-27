"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Database, Shield, Headphones, Zap, Globe, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { services } from "@/lib/config"

export function ServicesSection() {
  const { t, currentLang } = useLanguage()

  const icons = [Database, Shield, Headphones, Zap, Globe, Settings]

  return (
    <section id="services" className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("services")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("servicesDescription")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = icons[index]
            return (
              <motion.div
                key={service.title[currentLang]}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.title[currentLang]}</h3>
                    <p className="text-muted-foreground">{service.description[currentLang]}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
