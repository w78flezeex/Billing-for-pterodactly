"use client"

import { Button } from "@/components/ui/button"
import { Server, MessageCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"
import { siteConfig } from "@/lib/config"

interface FooterProps {
  onShowPrivacy: () => void
  onShowTerms: () => void
}

export function Footer({ onShowPrivacy, onShowTerms }: FooterProps) {
  const { t, currentLang } = useLanguage()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">{siteConfig.siteName}</span>
            </div>
            <p className="text-muted-foreground">{siteConfig.siteDescription[currentLang]}</p>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Discord
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Telegram
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("navigation")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("pricing")}
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("services")}
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("supportSection")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>{t("serverStatus")}</li>
              <li>{t("apiDocs")}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("contacts")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>{siteConfig.contacts.email}</li>
              <li>{siteConfig.contacts.telegram}</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left">
            <span className="text-muted-foreground text-sm block">
              © 2025 {siteConfig.siteName}. {t("developedBy")}
            </span>
            {/* Информация о разработчике */}
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="block">Сайт создан: @prd_yt</span>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                <Link 
                  href="https://t.me/worksprd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  @worksprd
                </Link>
                <span>•</span>
                <Link 
                  href="https://t.me/prdbotsell" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  @prdbotsell
                </Link>
                <span>•</span>
                <Link 
                  href="https://t.me/freecodeprd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  @freecodeprd
                </Link>
                <span>•</span>
                <Link 
                  href="https://t.me/prdrevies" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  @prdrevies
                </Link>
              </div>
            </div>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button
              onClick={onShowPrivacy}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("privacyPolicy")}
            </button>
            <button
              onClick={onShowTerms}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("termsOfService")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
