"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { siteConfig } from "@/lib/config"

export function HeroSection() {
  const { t, currentLang, isLoaded } = useLanguage()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Показываем загрузку пока язык не загружен
  if (!isLoaded) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 py-20 md:py-32">
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="h-20 bg-muted animate-pulse rounded mb-6"></div>
            <div className="h-6 bg-muted animate-pulse rounded mb-10 max-w-2xl mx-auto"></div>
            <div className="flex gap-4 justify-center mb-16">
              <div className="h-12 w-40 bg-muted animate-pulse rounded"></div>
              <div className="h-12 w-40 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 py-20 md:py-32">
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              {t("heroTitle")}
              <span className="text-primary">{t("heroTitleAccent")}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            {siteConfig.siteDescription[currentLang]}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="text-lg px-8" onClick={() => scrollToSection("pricing")}>
              {t("choosePlan")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent"
              onClick={() => scrollToSection("about")}
            >
              <Play className="mr-2 h-5 w-5" />
              {t("learnMore")}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
          >
            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary">{siteConfig.stats.uptime}</div>
              <div className="text-sm text-muted-foreground">{t("uptime")}</div>
            </div>
            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary">{siteConfig.stats.support}</div>
              <div className="text-sm text-muted-foreground">{t("support")}</div>
            </div>
            <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary">{siteConfig.stats.serverStart}</div>
              <div className="text-sm text-muted-foreground">{t("serverStart")}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
