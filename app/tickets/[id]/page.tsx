"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Shield,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface TicketMessage {
  id: string
  content: string
  isStaff: boolean
  staffName?: string
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  status: "OPEN" | "WAITING" | "ANSWERED" | "CLOSED"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  category?: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  user?: {
    id: string
    name: string
    email: string
  }
}

const statusConfig = {
  OPEN: { label: "Открыт", color: "bg-blue-500", icon: MessageSquare },
  WAITING: { label: "Ожидает ответа", color: "bg-yellow-500", icon: Clock },
  ANSWERED: { label: "Отвечен", color: "bg-green-500", icon: CheckCircle },
  CLOSED: { label: "Закрыт", color: "bg-gray-500", icon: XCircle },
}

const priorityConfig = {
  LOW: { label: "Низкий", color: "bg-gray-400" },
  NORMAL: { label: "Обычный", color: "bg-blue-400" },
  HIGH: { label: "Высокий", color: "bg-orange-500" },
  URGENT: { label: "Срочный", color: "bg-red-500" },
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [closingTicket, setClosingTicket] = useState(false)

  const ticketId = params.id as string
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPPORT" || user?.role === "MODERATOR"

  // Загрузка тикета
  const fetchTicket = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Для админов/саппорта используем другой endpoint
      const url = isStaff 
        ? `/api/admin/tickets/${ticketId}` 
        : `/api/tickets/${ticketId}`
      
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Тикет не найден")
        return
      }

      setTicket(data.ticket)
    } catch {
      setError("Ошибка при загрузке тикета")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated && ticketId) {
      fetchTicket()
    }
  }, [authLoading, isAuthenticated, ticketId, isStaff])

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [ticket?.messages])

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return

    setSendingMessage(true)
    try {
      const url = isStaff 
        ? `/api/admin/tickets/${ticketId}` 
        : `/api/tickets/${ticketId}`
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        setNewMessage("")
        await fetchTicket()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Закрытие тикета
  const handleCloseTicket = async () => {
    if (!ticket) return

    setClosingTicket(true)
    try {
      const url = isStaff 
        ? `/api/admin/tickets/${ticketId}` 
        : `/api/tickets/${ticketId}`
      
      const res = await fetch(url, {
        method: "PATCH",
      })

      if (res.ok) {
        await fetchTicket()
      }
    } catch (error) {
      console.error("Error closing ticket:", error)
    } finally {
      setClosingTicket(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={isStaff ? "/admin" : "/tickets"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Тикет</h1>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-xl font-semibold">Ошибка</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push(isStaff ? "/admin" : "/tickets")}>
                  Вернуться назад
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const StatusIcon = statusConfig[ticket.status]?.icon || MessageSquare

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={isStaff ? "/admin" : "/tickets"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusConfig[ticket.status]?.color}>
                  {statusConfig[ticket.status]?.label}
                </Badge>
                <Badge variant="outline" className={priorityConfig[ticket.priority]?.color}>
                  {priorityConfig[ticket.priority]?.label}
                </Badge>
                {ticket.category && (
                  <Badge variant="secondary">{ticket.category}</Badge>
                )}
              </div>
            </div>
          </div>
          
          {ticket.status !== "CLOSED" && (
            <Button 
              variant="outline" 
              onClick={handleCloseTicket}
              disabled={closingTicket}
            >
              {closingTicket ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Закрыть тикет
            </Button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Информация о пользователе (для саппорта) */}
          {isStaff && ticket.user && (
            <Card className="mb-6">
              <CardHeader className="py-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {ticket.user.name?.charAt(0) || ticket.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ticket.user.name || "Пользователь"}</p>
                    <p className="text-sm text-muted-foreground">{ticket.user.email}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Сообщения */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Переписка
              </CardTitle>
              <CardDescription>
                Создан: {new Date(ticket.createdAt).toLocaleString("ru-RU")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isStaff ? "" : "flex-row-reverse"}`}
                  >
                    <Avatar className={msg.isStaff ? "bg-primary" : "bg-muted"}>
                      <AvatarFallback>
                        {msg.isStaff ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 max-w-[80%] rounded-lg p-4 ${
                        msg.isStaff
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {msg.isStaff ? (msg.staffName || "Поддержка") : "Вы"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Форма ответа */}
          {ticket.status !== "CLOSED" ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Введите ваше сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        handleSendMessage()
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Ctrl + Enter для отправки
                    </p>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Отправить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  <p>Тикет закрыт. Создайте новый тикет, если вам нужна помощь.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}
