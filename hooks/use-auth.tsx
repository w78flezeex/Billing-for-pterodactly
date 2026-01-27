"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  avatar?: string | null
  phone?: string | null
  company?: string | null
  role: string
  balance: number
  emailVerified: boolean
  twoFactorEnabled?: boolean
  createdAt: string
  lastLoginAt?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean; tempToken?: string }>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return data.user
      } else {
        setUser(null)
        return null
      }
    } catch {
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      await refreshUser()
      setIsLoading(false)
    }
    init()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      // Проверяем, нужна ли 2FA
      if (data.requires2FA) {
        return { success: false, requires2FA: true, tempToken: data.tempToken }
      }

      setUser(data.user)
      return { success: true }
    } catch {
      return { success: false, error: "Ошибка подключения к серверу" }
    }
  }

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      setUser(data.user)
      return { success: true }
    } catch {
      return { success: false, error: "Ошибка подключения к серверу" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch {
      // Игнорируем ошибки при выходе
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
