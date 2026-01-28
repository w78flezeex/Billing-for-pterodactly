"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { Language, translations, languages } from "./translations"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  languages: typeof languages
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Автоопределение языка
function detectLanguage(): Language {
  if (typeof window === "undefined") return "ru"
  
  // Проверяем сохранённый язык
  const saved = localStorage.getItem("language") as Language
  if (saved && ["ru", "en", "ua"].includes(saved)) {
    return saved
  }
  
  // Определяем по браузеру
  const browserLang = navigator.language.toLowerCase()
  
  if (browserLang.startsWith("uk") || browserLang.startsWith("ua")) {
    return "ua"
  }
  if (browserLang.startsWith("en")) {
    return "en"
  }
  
  return "ru" // По умолчанию русский
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const detected = detectLanguage()
    setLanguageState(detected)
    setIsHydrated(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    document.documentElement.lang = lang === "ua" ? "uk" : lang
  }, [])

  // Функция перевода
  const t = useCallback((key: string): string => {
    const keys = key.split(".")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = translations
    
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k]
      } else {
        console.warn(`Translation not found: ${key}`)
        return key
      }
    }
    
    if (result && typeof result === "object" && language in result) {
      return result[language]
    }
    
    console.warn(`Translation not found for language ${language}: ${key}`)
    return key
  }, [language])

  // Предотвращаем гидратационные ошибки
  if (!isHydrated) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}

// Хук для получения только функции перевода
export function useTranslation() {
  const { t, language } = useI18n()
  return { t, language }
}
