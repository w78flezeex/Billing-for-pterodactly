"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Server,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"

interface ServerNode {
  id: string
  name: string
  location: string
  status: "online" | "offline" | "maintenance" | "degraded"
  uptime: number
  load: number
}

interface Incident {
  id: string
  title: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  severity: "minor" | "major" | "critical"
  createdAt: string
  updatedAt: string
  updates: {
    id: string
    message: string
    createdAt: string
  }[]
}

export default function StatusPage() {
  const [nodes, setNodes] = useState<ServerNode[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStatus = async () => {
    try {
      // Демо-данные (в реальности будет API)
      setNodes([
        { id: "1", name: "EU-1", location: "Frankfurt", status: "online", uptime: 99.99, load: 45 },
        { id: "2", name: "EU-2", location: "Amsterdam", status: "online", uptime: 99.95, load: 62 },
        { id: "3", name: "US-1", location: "New York", status: "online", uptime: 99.98, load: 38 },
        { id: "4", name: "US-2", location: "Los Angeles", status: "degraded", uptime: 99.50, load: 85 },
        { id: "5", name: "RU-1", location: "Moscow", status: "online", uptime: 99.97, load: 55 },
        { id: "6", name: "RU-2", location: "Saint Petersburg", status: "maintenance", uptime: 99.90, load: 0 },
      ])

      setIncidents([
        {
          id: "1",
          title: "Высокая нагрузка на US-2",
          status: "monitoring",
          severity: "minor",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updates: [
            {
              id: "1",
              message: "Выявлена повышенная нагрузка. Проводим оптимизацию.",
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "2",
              message: "Нагрузка стабилизируется. Мониторим ситуацию.",
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
          ],
        },
        {
          id: "2",
          title: "Плановое обслуживание RU-2",
          status: "identified",
          severity: "minor",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updates: [
            {
              id: "1",
              message: "Проводим плановое обновление оборудования. Ожидаемое время завершения: 2 часа.",
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
      ])

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "offline":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "maintenance":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Работает</Badge>
      case "offline":
        return <Badge variant="destructive">Недоступен</Badge>
      case "maintenance":
        return <Badge variant="secondary">Обслуживание</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500">Проблемы</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getIncidentStatusBadge = (status: string) => {
    switch (status) {
      case "investigating":
        return <Badge variant="destructive">Исследуется</Badge>
      case "identified":
        return <Badge className="bg-yellow-500">Выявлено</Badge>
      case "monitoring":
        return <Badge variant="secondary">Мониторинг</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Решено</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Критический</Badge>
      case "major":
        return <Badge className="bg-orange-500">Серьёзный</Badge>
      case "minor":
        return <Badge variant="outline">Незначительный</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const allOnline = nodes.every(n => n.status === "online")
  const hasIssues = nodes.some(n => n.status === "degraded" || n.status === "offline")

  if (isLoading) {
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
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Статус серверов</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Overall Status */}
          <Card className={`border-2 ${allOnline ? "border-green-500 bg-green-500/5" : hasIssues ? "border-yellow-500 bg-yellow-500/5" : "border-red-500 bg-red-500/5"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {allOnline ? (
                    <Wifi className="h-12 w-12 text-green-500" />
                  ) : hasIssues ? (
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <WifiOff className="h-12 w-12 text-red-500" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {allOnline
                        ? "Все системы работают"
                        : hasIssues
                        ? "Частичные проблемы"
                        : "Сбой в работе"}
                    </h2>
                    <p className="text-muted-foreground">
                      Обновлено: {lastUpdated.toLocaleTimeString("ru-RU")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-500">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime за 30 дней</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Server Nodes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Серверные ноды
              </CardTitle>
              <CardDescription>
                Состояние всех дата-центров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(node.status)}
                      <div>
                        <p className="font-medium">{node.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {node.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{node.uptime}%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{node.load}%</p>
                        <p className="text-xs text-muted-foreground">Нагрузка</p>
                      </div>
                      {getStatusBadge(node.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Текущие инциденты
              </CardTitle>
              <CardDescription>
                Активные проблемы и плановые работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{incident.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(incident.createdAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getSeverityBadge(incident.severity)}
                          {getIncidentStatusBadge(incident.status)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {incident.updates.map((update) => (
                          <div key={update.id} className="pl-4 border-l-2 border-muted">
                            <p className="text-sm">{update.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(update.createdAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>Нет активных инцидентов</p>
                  <p className="text-sm">Все системы работают нормально</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>История за 90 дней</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {Array.from({ length: 90 }).map((_, i) => {
                  const isToday = i === 89
                  const hasIssue = [15, 42, 67].includes(i)
                  return (
                    <div
                      key={i}
                      className={`h-8 w-full rounded-sm ${
                        isToday
                          ? "bg-blue-500"
                          : hasIssue
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      title={`${90 - i} дней назад`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>90 дней назад</span>
                <span>Сегодня</span>
              </div>
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-green-500" />
                  <span>Работает</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-yellow-500" />
                  <span>Частичные проблемы</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-500" />
                  <span>Сбой</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
