"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// Страницы без Header и Footer
const noLayoutPages = ["/login", "/register", "/forgot-password", "/reset-password"]
// Страницы без Header
const noHeaderPages: string[] = []
// Страницы без Footer (admin имеет свой layout, главная имеет свой footer)
const noFooterPages = ["/admin"]
// Главная страница имеет свой footer с модальными окнами
const customFooterPages = ["/"]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const isNoLayout = noLayoutPages.some(page => pathname.startsWith(page))
  const isNoHeader = noHeaderPages.some(page => pathname.startsWith(page))
  const isNoFooter = noFooterPages.some(page => pathname.startsWith(page))
  const isCustomFooter = customFooterPages.includes(pathname)
  
  const showHeader = !isNoLayout && !isNoHeader
  const showFooter = !isNoLayout && !isNoFooter && !isCustomFooter

  return (
    <>
      {showHeader && <Header />}
      <main className="min-h-screen">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  )
}
