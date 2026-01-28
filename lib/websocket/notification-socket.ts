/**
 * WebSocket система для real-time уведомлений
 * Используется для мгновенных уведомлений без перезагрузки страницы
 */

import { EventEmitter } from "events"

export interface NotificationPayload {
  id: string
  type: "info" | "success" | "warning" | "error" | "payment" | "server" | "ticket"
  title: string
  message: string
  link?: string
  createdAt: Date
}

export interface WebSocketMessage {
  event: string
  data: unknown
}

class NotificationSocket extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private userId: string | null = null
  private isConnecting = false

  constructor() {
    super()
  }

  connect(userId: string): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.userId = userId
    this.isConnecting = true

    const wsUrl = this.getWebSocketUrl()
    
    try {
      this.ws = new WebSocket(`${wsUrl}/api/ws?userId=${userId}`)

      this.ws.onopen = () => {
        console.log("[WS] Connected")
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emit("connected")
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error("[WS] Failed to parse message:", error)
        }
      }

      this.ws.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code, event.reason)
        this.isConnecting = false
        this.stopHeartbeat()
        this.emit("disconnected")
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error("[WS] Error:", error)
        this.isConnecting = false
        this.emit("error", error)
      }
    } catch (error) {
      console.error("[WS] Failed to connect:", error)
      this.isConnecting = false
      this.attemptReconnect()
    }
  }

  private getWebSocketUrl(): string {
    if (typeof window === "undefined") return ""
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    return `${protocol}//${host}`
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.event) {
      case "notification":
        this.emit("notification", message.data as NotificationPayload)
        break
      case "server:status":
        this.emit("server:status", message.data)
        break
      case "payment:update":
        this.emit("payment:update", message.data)
        break
      case "ticket:reply":
        this.emit("ticket:reply", message.data)
        break
      case "balance:update":
        this.emit("balance:update", message.data)
        break
      case "pong":
        // Heartbeat response
        break
      default:
        this.emit(message.event, message.data)
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: "ping" }))
      }
    }, 30000) // Ping каждые 30 секунд
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WS] Max reconnect attempts reached")
      this.emit("reconnect:failed")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId)
      }
    }, delay)
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.userId = null
    this.reconnectAttempts = 0
  }

  send(event: string, data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }))
    } else {
      console.warn("[WS] Cannot send message - not connected")
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const notificationSocket = new NotificationSocket()

// React hook для использования WebSocket
import { useEffect, useState, useCallback } from "react"

export function useNotificationSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])

  useEffect(() => {
    if (!userId) return

    const handleConnected = () => setIsConnected(true)
    const handleDisconnected = () => setIsConnected(false)
    const handleNotification = (notification: NotificationPayload) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)) // Храним последние 50
    }

    notificationSocket.on("connected", handleConnected)
    notificationSocket.on("disconnected", handleDisconnected)
    notificationSocket.on("notification", handleNotification)

    notificationSocket.connect(userId)

    return () => {
      notificationSocket.off("connected", handleConnected)
      notificationSocket.off("disconnected", handleDisconnected)
      notificationSocket.off("notification", handleNotification)
    }
  }, [userId])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    isConnected,
    notifications,
    clearNotifications,
    socket: notificationSocket,
  }
}
