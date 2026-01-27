"use client"

import { useState, useEffect } from "react"
import { translations, extendedTranslations, type Language, type TranslationKey, type ExtendedTranslationKey } from "@/lib/translations"

export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<Language>("ru")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && translations[savedLang]) {
      setCurrentLang(savedLang)
    }
    setIsLoaded(true)
  }, [])

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang)
    localStorage.setItem("language", lang)

    // Принудительная перезагрузка страницы для обновления всех компонентов
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  // Базовые переводы
  const t = (key: TranslationKey): string => {
    if (!isLoaded) return ""
    return translations[currentLang]?.[key] || translations.ru[key] || key
  }

  // Расширенные переводы (для страниц профиля, биллинга, админки и т.д.)
  const te = (key: ExtendedTranslationKey): string => {
    if (!isLoaded) return ""
    return extendedTranslations[currentLang]?.[key] || extendedTranslations.ru[key] || key
  }

  // Универсальный перевод (ищет сначала в базовых, потом в расширенных)
  const tt = (key: string): string => {
    if (!isLoaded) return ""
    // @ts-ignore
    return translations[currentLang]?.[key] || extendedTranslations[currentLang]?.[key] || 
           // @ts-ignore
           translations.ru[key] || extendedTranslations.ru[key] || key
  }

  return {
    currentLang,
    changeLanguage,
    t,
    te, // extended translations
    tt, // universal translations
    isLoaded,
  }
}
