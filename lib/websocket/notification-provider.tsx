"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { notificationSocket, NotificationPayload } from "./notification-socket"
import { useToast } from "@/hooks/use-toast"

interface NotificationContextType {
  isConnected: boolean
  notifications: NotificationPayload[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string | null
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return

    const handleConnected = () => {
      setIsConnected(true)
      console.log("[Notifications] WebSocket connected")
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      console.log("[Notifications] WebSocket disconnected")
    }

    const handleNotification = (notification: NotificationPayload) => {
      setNotifications(prev => [notification, ...prev].slice(0, 100))
      
      // Показываем toast для новых уведомлений
      const iconMap = {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        payment: "💳",
        server: "🖥️",
        ticket: "🎫",
      }

      toast({
        title: `${iconMap[notification.type]} ${notification.title}`,
        description: notification.message,
      })

      // Воспроизводим звук уведомления
      playNotificationSound()
    }

    const handleServerStatus = (data: { serverId: string; status: string }) => {
      setNotifications(prev => [{
        id: `server-${Date.now()}`,
        type: "server",
        title: "Статус сервера изменён",
        message: `Сервер ${data.serverId}: ${data.status}`,
        createdAt: new Date(),
      }, ...prev].slice(0, 100))
    }

    const handlePaymentUpdate = (data: { amount: number; status: string }) => {
      if (data.status === "COMPLETED") {
        setNotifications(prev => [{
          id: `payment-${Date.now()}`,
          type: "payment",
          title: "Платёж получен",
          message: `+${data.amount.toLocaleString("ru-RU")} ₽ зачислено на баланс`,
          createdAt: new Date(),
        }, ...prev].slice(0, 100))
      }
    }

    const handleTicketReply = (data: { ticketId: string; subject: string }) => {
      setNotifications(prev => [{
        id: `ticket-${Date.now()}`,
        type: "ticket",
        title: "Ответ на тикет",
        message: `Новый ответ в тикете: ${data.subject}`,
        link: `/tickets/${data.ticketId}`,
        createdAt: new Date(),
      }, ...prev].slice(0, 100))
    }

    notificationSocket.on("connected", handleConnected)
    notificationSocket.on("disconnected", handleDisconnected)
    notificationSocket.on("notification", handleNotification)
    notificationSocket.on("server:status", handleServerStatus)
    notificationSocket.on("payment:update", handlePaymentUpdate)
    notificationSocket.on("ticket:reply", handleTicketReply)

    notificationSocket.connect(userId)

    return () => {
      notificationSocket.off("connected", handleConnected)
      notificationSocket.off("disconnected", handleDisconnected)
      notificationSocket.off("notification", handleNotification)
      notificationSocket.off("server:status", handleServerStatus)
      notificationSocket.off("payment:update", handlePaymentUpdate)
      notificationSocket.off("ticket:reply", handleTicketReply)
      notificationSocket.disconnect()
    }
  }, [userId, toast])

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => new Set([...prev, id]))
  }, [])

  const markAllAsRead = useCallback(() => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }, [notifications])

  const clearAll = useCallback(() => {
    setNotifications([])
    setReadIds(new Set())
  }, [])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  return (
    <NotificationContext.Provider value={{
      isConnected,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

// Звук уведомления
function playNotificationSound() {
  if (typeof window === "undefined") return
  
  try {
    const audio = new Audio("/sounds/notification.mp3")
    audio.volume = 0.5
    audio.play().catch(() => {
      // Игнорируем ошибки автовоспроизведения
    })
  } catch {
    // Игнорируем
  }
}
