/**
 * Push-уведомления в браузере
 * Использует Web Push API для отправки уведомлений даже когда вкладка закрыта
 */

// Публичный ключ VAPID (нужно сгенерировать свой)
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || ""

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  /**
   * Проверяет поддержку Push API
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    )
  }

  /**
   * Проверяет разрешение на уведомления
   */
  getPermissionStatus(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported"
    return Notification.permission
  }

  /**
   * Запрашивает разрешение на уведомления
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported")
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Регистрирует Service Worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error("Service Worker is not supported")
    }

    this.registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })

    console.log("[Push] Service Worker registered")
    return this.registration
  }

  /**
   * Подписывается на Push-уведомления
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      await this.registerServiceWorker()
    }

    if (!this.registration) {
      throw new Error("Failed to register Service Worker")
    }

    const permission = await this.requestPermission()
    if (permission !== "granted") {
      console.log("[Push] Permission denied")
      return null
    }

    try {
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })

      console.log("[Push] Subscribed:", this.subscription.endpoint)

      // Отправляем подписку на сервер
      const subscriptionData = this.getSubscriptionData()
      if (subscriptionData) {
        await this.sendSubscriptionToServer(subscriptionData)
      }

      return subscriptionData
    } catch (error) {
      console.error("[Push] Failed to subscribe:", error)
      throw error
    }
  }

  /**
   * Отписывается от Push-уведомлений
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      const reg = await navigator.serviceWorker.ready
      this.subscription = await reg.pushManager.getSubscription()
    }

    if (!this.subscription) {
      return true
    }

    try {
      await this.removeSubscriptionFromServer(this.subscription.endpoint)
      const result = await this.subscription.unsubscribe()
      this.subscription = null
      console.log("[Push] Unsubscribed")
      return result
    } catch (error) {
      console.error("[Push] Failed to unsubscribe:", error)
      throw error
    }
  }

  /**
   * Получает текущую подписку
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      try {
        this.registration = await navigator.serviceWorker.ready
      } catch {
        return null
      }
    }

    return this.registration.pushManager.getSubscription()
  }

  /**
   * Проверяет, подписан ли пользователь
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription()
    return subscription !== null
  }

  /**
   * Показывает локальное уведомление (без push)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) return

    const permission = this.getPermissionStatus()
    if (permission !== "granted") return

    if (!this.registration) {
      await this.registerServiceWorker()
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        vibrate: [100, 50, 100],
        ...options,
      })
    }
  }

  /**
   * Преобразует данные подписки для отправки на сервер
   */
  private getSubscriptionData(): PushSubscriptionData | null {
    if (!this.subscription) return null

    const json = this.subscription.toJSON()
    if (!json.keys?.p256dh || !json.keys?.auth) return null

    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    }
  }

  /**
   * Отправляет подписку на сервер
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscriptionData
  ): Promise<void> {
    try {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      })
    } catch (error) {
      console.error("[Push] Failed to save subscription:", error)
    }
  }

  /**
   * Удаляет подписку с сервера
   */
  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    try {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      })
    } catch (error) {
      console.error("[Push] Failed to remove subscription:", error)
    }
  }

  /**
   * Преобразует base64 ключ в Uint8Array для VAPID
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }
}

// Singleton
export const pushManager = new PushNotificationManager()

// React hook
import { useState, useEffect, useCallback } from "react"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supported = pushManager.isSupported()
    setIsSupported(supported)

    if (supported) {
      setPermission(pushManager.getPermissionStatus())
      pushManager.isSubscribed().then(setIsSubscribed)
    }
  }, [])

  const subscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      const subscription = await pushManager.subscribe()
      setIsSubscribed(!!subscription)
      setPermission(pushManager.getPermissionStatus())
      return subscription
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      await pushManager.unsubscribe()
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      await pushManager.showLocalNotification(title, options)
    },
    []
  )

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    showNotification,
  }
}
