"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Server,
  ArrowLeft,
  Loader2,
  Plus,
  Play,
  Square,
  RotateCw,
  Terminal,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Clock,
  Settings,
  Trash2,
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Power,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ServerData {
  id: string
  name: string
  status: string
  pterodactylId: string | null
  ipAddress: string | null
  port: number | null
  expiresAt: string
  createdAt: string
  plan: {
    name: string
    type: string
    cpu: number
    ram: number
    disk: number
  }
  location: {
    name: string
    country: string
    flag: string
  }
}

interface ServerStats {
  cpu: number
  memory: number
  disk: number
  network: { rx: number; tx: number }
  uptime: number
}

export default function ServersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  const [servers, setServers] = useState<ServerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [serverStats, setServerStats] = useState<Record<string, ServerStats>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  const fetchServers = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const res = await fetch("/api/servers")
      if (res.ok) {
        const data = await res.json()
        setServers(data.servers || [])
      }
    } catch (error) {
      console.error("Error fetching servers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      fetchServers()
    }
  }, [authLoading, fetchServers])

  const handlePowerAction = async (serverId: string, action: "start" | "stop" | "restart" | "kill") => {
    setActionLoading(`${serverId}-${action}`)
    
    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Обновляем список серверов через 2 секунды
        setTimeout(fetchServers, 2000)
      }
    } catch (error) {
      console.error("Power action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteServer = async (serverId: string) => {
    setActionLoading(`${serverId}-delete`)
    
    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setServers(prev => prev.filter(s => s.id !== serverId))
      }
    } catch (error) {
      console.error("Delete server error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Работает</Badge>
      case "starting":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Запускается</Badge>
      case "stopping":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Останавливается</Badge>
      case "stopped":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Остановлен</Badge>
      case "suspended":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Приостановлен</Badge>
      case "installing":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Установка</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDaysLeft = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Мои серверы</h1>
          </div>
          <Link href="/order">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Заказать сервер
            </Button>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {servers.length > 0 ? (
            <div className="grid gap-6">
              {servers.map((server) => {
                const daysLeft = getDaysLeft(server.expiresAt)
                const isExpiringSoon = daysLeft <= 3
                const isExpired = daysLeft <= 0

                return (
                  <Card key={server.id} className={isExpired ? "border-red-500" : isExpiringSoon ? "border-yellow-500" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Server className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {server.name}
                              {getStatusBadge(server.status)}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <span>{server.location.flag} {server.location.name}</span>
                              <span>•</span>
                              <span>{server.plan.name}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePowerAction(server.id, "start")}
                            disabled={server.status === "running" || actionLoading !== null}
                          >
                            {actionLoading === `${server.id}-start` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePowerAction(server.id, "stop")}
                            disabled={server.status === "stopped" || actionLoading !== null}
                          >
                            {actionLoading === `${server.id}-stop` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePowerAction(server.id, "restart")}
                            disabled={server.status === "stopped" || actionLoading !== null}
                          >
                            {actionLoading === `${server.id}-restart` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Resources */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <Cpu className="h-3 w-3" /> CPU
                              </span>
                              <span>{server.plan.cpu}%</span>
                            </div>
                            <Progress value={30} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <MemoryStick className="h-3 w-3" /> RAM
                              </span>
                              <span>{server.plan.ram} MB</span>
                            </div>
                            <Progress value={45} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" /> Диск
                              </span>
                              <span>{server.plan.disk} MB</span>
                            </div>
                            <Progress value={20} className="h-2" />
                          </div>
                        </div>

                        {/* Connection Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Подключение</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{server.ipAddress || "Назначается..."}:{server.port || "..."}</span>
                            </div>
                            {server.pterodactylId && (
                              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                                <a href={`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/server/${server.pterodactylId}`} target="_blank">
                                  <Terminal className="h-3 w-3 mr-1" />
                                  Открыть консоль
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expiration */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Срок действия</h4>
                          <div className={`text-sm ${isExpired ? "text-red-500" : isExpiringSoon ? "text-yellow-500" : "text-muted-foreground"}`}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                {isExpired
                                  ? "Срок истёк!"
                                  : `Осталось ${daysLeft} дней`}
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              до {new Date(server.expiresAt).toLocaleDateString("ru-RU")}
                            </p>
                          </div>
                          {(isExpiringSoon || isExpired) && (
                            <Button size="sm" variant={isExpired ? "destructive" : "default"}>
                              Продлить
                            </Button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Управление</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3 mr-1" />
                              Настройки
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Удалить
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить сервер?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Сервер и все данные будут удалены безвозвратно.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteServer(server.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    {actionLoading === `${server.id}-delete` ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">У вас пока нет серверов</h2>
                <p className="text-muted-foreground mb-6">
                  Закажите свой первый сервер и начните работу
                </p>
                <Link href="/order">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Заказать сервер
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}
