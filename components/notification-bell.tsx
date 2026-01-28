"use client"

import * as React from "react"
import { Bell, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/lib/websocket"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isConnected } = useNotifications()
  const { t } = useI18n()
  const [isOpen, setIsOpen] = React.useState(false)

  const iconMap: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    payment: "💳",
    server: "🖥️",
    ticket: "🎫",
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Только что"
    if (minutes < 60) return `${minutes} мин. назад`
    if (hours < 24) return `${hours} ч. назад`
    return `${days} дн. назад`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {/* Индикатор подключения */}
          <span className={cn(
            "absolute bottom-0 right-0 h-2 w-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="sr-only">{t("notifications.title")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">{t("notifications.title")}</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Прочитать
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{t("notifications.noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer relative",
                    !notification.id.includes("read") && "bg-primary/5"
                  )}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.link) {
                      setIsOpen(false)
                    }
                  }}
                >
                  {notification.link ? (
                    <Link href={notification.link} className="block">
                      <NotificationItem notification={notification} iconMap={iconMap} formatTime={formatTime} />
                    </Link>
                  ) : (
                    <NotificationItem notification={notification} iconMap={iconMap} formatTime={formatTime} />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Статус подключения */}
        <div className="border-t p-2 text-center">
          <span className={cn(
            "text-xs",
            isConnected ? "text-green-600" : "text-red-600"
          )}>
            {isConnected ? "🟢 Подключено" : "🔴 Отключено"}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: {
    type: string
    title: string
    message: string
    createdAt: Date
  }
  iconMap: Record<string, string>
  formatTime: (date: Date) => string
}

function NotificationItem({ notification, iconMap, formatTime }: NotificationItemProps) {
  return (
    <div className="flex gap-3">
      <span className="text-lg flex-shrink-0">
        {iconMap[notification.type] || "📌"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </div>
  )
}
