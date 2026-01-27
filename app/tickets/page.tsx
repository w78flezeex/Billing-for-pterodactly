"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Send,
  Loader2
} from "lucide-react"

interface Ticket {
  id: string
  subject: string
  status: "OPEN" | "WAITING" | "ANSWERED" | "CLOSED"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  category?: string
  createdAt: string
  updatedAt: string
  messages: { content: string; createdAt: string }[]
  _count: { messages: number }
}

interface TicketMessage {
  id: string
  content: string
  isStaff: boolean
  staffName?: string
  createdAt: string
}

interface TicketDetail {
  id: string
  subject: string
  status: string
  priority: string
  category?: string
  createdAt: string
  messages: TicketMessage[]
}

const statusConfig = {
  OPEN: { label: "Открыт", color: "bg-blue-500", icon: MessageSquare },
  WAITING: { label: "Ожидает ответа", color: "bg-yellow-500", icon: Clock },
  ANSWERED: { label: "Отвечен", color: "bg-green-500", icon: CheckCircle },
  CLOSED: { label: "Закрыт", color: "bg-gray-500", icon: CheckCircle },
}

const priorityConfig = {
  LOW: { label: "Низкий", color: "bg-gray-400" },
  NORMAL: { label: "Обычный", color: "bg-blue-400" },
  HIGH: { label: "Высокий", color: "bg-orange-500" },
  URGENT: { label: "Срочный", color: "bg-red-500" },
}

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // Создание тикета
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "NORMAL",
    category: "",
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets")
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      const data = await res.json()
      setSelectedTicket(data.ticket)
    } catch (error) {
      console.error("Error fetching ticket:", error)
    }
  }

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) return

    setCreateLoading(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      })

      if (res.ok) {
        setIsCreateOpen(false)
        setNewTicket({ subject: "", message: "", priority: "NORMAL", category: "" })
        fetchTickets()
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
    } finally {
      setCreateLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        setNewMessage("")
        fetchTicketDetails(selectedTicket.id)
        fetchTickets()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const closeTicket = async () => {
    if (!selectedTicket) return

    try {
      await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
      })
      setSelectedTicket(null)
      fetchTickets()
    } catch (error) {
      console.error("Error closing ticket:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Детальный просмотр тикета
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => setSelectedTicket(null)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedTicket.subject}</CardTitle>
                <CardDescription>
                  Создан: {new Date(selectedTicket.createdAt).toLocaleString("ru-RU")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={priorityConfig[selectedTicket.priority as keyof typeof priorityConfig]?.color}>
                  {priorityConfig[selectedTicket.priority as keyof typeof priorityConfig]?.label}
                </Badge>
                <Badge className={statusConfig[selectedTicket.status as keyof typeof statusConfig]?.color}>
                  {statusConfig[selectedTicket.status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Сообщения */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
                {selectedTicket.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isStaff ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.isStaff
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      {msg.isStaff && (
                        <p className="text-xs text-primary font-medium mb-1">
                          {msg.staffName || "Поддержка"}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Отправка сообщения */}
              {selectedTicket.status !== "CLOSED" ? (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" onClick={closeTicket}>
                      Закрыть
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Тикет закрыт</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Список тикетов
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Тикеты</h1>
              <p className="text-muted-foreground">Управление обращениями в поддержку</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать тикет
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Новый тикет</DialogTitle>
                  <DialogDescription>
                    Опишите вашу проблему, и мы поможем её решить
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Тема</label>
                    <Input
                      placeholder="Краткое описание проблемы"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Приоритет</label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Низкий</SelectItem>
                          <SelectItem value="NORMAL">Обычный</SelectItem>
                          <SelectItem value="HIGH">Высокий</SelectItem>
                          <SelectItem value="URGENT">Срочный</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Категория</label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Техническая</SelectItem>
                          <SelectItem value="billing">Биллинг</SelectItem>
                          <SelectItem value="sales">Продажи</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Сообщение</label>
                    <Textarea
                      placeholder="Подробно опишите вашу проблему..."
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={createTicket} disabled={createLoading}>
                    {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  У вас пока нет тикетов
                </p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать первый тикет
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fetchTicketDetails(ticket.id)}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${statusConfig[ticket.status]?.color}/20`}>
                          {(() => {
                            const Icon = statusConfig[ticket.status]?.icon || MessageSquare
                            return <Icon className={`h-5 w-5 ${statusConfig[ticket.status]?.color.replace('bg-', 'text-')}`} />
                          })()}
                        </div>
                        <div>
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ticket._count.messages} сообщений · Обновлен:{" "}
                            {new Date(ticket.updatedAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={priorityConfig[ticket.priority]?.color.replace('bg-', 'border-')}>
                          {priorityConfig[ticket.priority]?.label}
                        </Badge>
                        <Badge className={statusConfig[ticket.status]?.color}>
                          {statusConfig[ticket.status]?.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
