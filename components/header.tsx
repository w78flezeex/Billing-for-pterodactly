"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Server, Globe, User, LogOut, Ticket, ShoppingCart, HelpCircle, Settings, Wallet, Users, Activity, HardDrive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/hooks/use-language"
import { useAuth } from "@/hooks/use-auth"
import { siteConfig } from "@/lib/config"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentLang, changeLanguage, t, isLoaded } = useLanguage()
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false)
  }

  const handleLanguageChange = (lang: "ru" | "en" | "ua") => {
    changeLanguage(lang)
  }

  const navigation = [
    { name: t("about"), href: "about" },
    { name: t("pricing"), href: "pricing" },
    { name: t("services"), href: "services" },
    { name: t("testimonials"), href: "testimonials" },
    { name: t("contact"), href: "contact" },
  ]

  const langDisplay = {
    ru: "RU",
    en: "EN",
    ua: "UA",
  }

  // Показываем загрузку пока язык не загружен
  if (!isLoaded) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">{siteConfig.siteName}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-8 bg-muted animate-pulse rounded"></div>
            <ThemeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">{siteConfig.siteName}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => scrollToSection(item.href)}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                {langDisplay[currentLang]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleLanguageChange("ru")}>🇷🇺 Русский</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange("en")}>🇺🇸 English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange("ua")}>🇺🇦 Українська</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          {/* Auth Button - Desktop */}
          {!authLoading && (
            isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden md:inline-flex gap-2">
                    <User className="h-4 w-4" />
                    {user?.name || "Профиль"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/servers" className="flex items-center gap-2 cursor-pointer">
                      <HardDrive className="h-4 w-4" />
                      Мои серверы
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/order" className="flex items-center gap-2 cursor-pointer">
                      <ShoppingCart className="h-4 w-4" />
                      Заказать сервер
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/balance" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      Баланс
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referral" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Рефералы
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center gap-2 cursor-pointer">
                      <Ticket className="h-4 w-4" />
                      Тикеты
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/faq" className="flex items-center gap-2 cursor-pointer">
                      <HelpCircle className="h-4 w-4" />
                      База знаний
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/status" className="flex items-center gap-2 cursor-pointer">
                      <Activity className="h-4 w-4" />
                      Статус серверов
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Настройки
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Админ-панель
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="hidden md:inline-flex">{t("loginPanel")}</Button>
              </Link>
            )
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left text-lg font-medium transition-colors hover:text-primary"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="flex items-center justify-between mt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        {langDisplay[currentLang]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleLanguageChange("ru")}>🇷🇺 Русский</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLanguageChange("en")}>🇺🇸 English</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLanguageChange("ua")}>🇺🇦 Українська</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ThemeToggle />
                </div>
                {/* Mobile Auth */}
                {!authLoading && (
                  isAuthenticated ? (
                    <div className="space-y-2 mt-4">
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Button className="w-full" variant="outline">
                          <User className="h-4 w-4 mr-2" />
                          Личный кабинет
                        </Button>
                      </Link>
                      <Link href="/order" onClick={() => setIsOpen(false)}>
                        <Button className="w-full" variant="outline">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Заказать сервер
                        </Button>
                      </Link>
                      <Link href="/tickets" onClick={() => setIsOpen(false)}>
                        <Button className="w-full" variant="outline">
                          <Ticket className="h-4 w-4 mr-2" />
                          Тикеты
                        </Button>
                      </Link>
                      <Link href="/faq" onClick={() => setIsOpen(false)}>
                        <Button className="w-full" variant="outline">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          База знаний
                        </Button>
                      </Link>
                      {user?.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Button className="w-full" variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Админ-панель
                          </Button>
                        </Link>
                      )}
                      <Button 
                        className="w-full" 
                        variant="ghost"
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Выйти
                      </Button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button className="mt-4 w-full">{t("loginPanel")}</Button>
                    </Link>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
