"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ScrollText, 
  Loader2, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Server,
  CreditCard,
  Ticket,
  Settings,
  Shield,
  Globe
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AuditLog {
  id: string
  userId?: string
  userEmail?: string
  action: string
  entityType?: string
  entityId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const ENTITY_TYPES = [
  { value: "", label: "Все типы" },
  { value: "User", label: "Пользователи" },
  { value: "Server", label: "Серверы" },
  { value: "Payment", label: "Платежи" },
  { value: "Ticket", label: "Тикеты" },
  { value: "Settings", label: "Настройки" },
  { value: "Auth", label: "Авторизация" },
]

export default function AuditPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })

  // Filters
  const [searchAction, setSearchAction] = useState("")
  const [entityType, setEntityType] = useState("")
  const [userId, setUserId] = useState("")

  // Details dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, entityType])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchAction) params.append("action", searchAction)
      if (entityType) params.append("entityType", entityType)
      if (userId) params.append("userId", userId)

      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()

      if (data.logs) {
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const getEntityIcon = (type?: string) => {
    switch (type) {
      case "User": return <User className="h-4 w-4" />
      case "Server": return <Server className="h-4 w-4" />
      case "Payment": return <CreditCard className="h-4 w-4" />
      case "Ticket": return <Ticket className="h-4 w-4" />
      case "Settings": return <Settings className="h-4 w-4" />
      case "Auth": return <Shield className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getActionBadgeColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("DELETE") || action.includes("REMOVE")) return "destructive"
    if (action.includes("CREATE") || action.includes("ADD")) return "default"
    if (action.includes("UPDATE") || action.includes("EDIT")) return "secondary"
    return "outline"
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ScrollText className="h-8 w-8" />
          Аудит лог
        </h1>
        <p className="text-muted-foreground">
          История всех действий в системе
        </p>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Поиск по действию..."
                value={searchAction}
                onChange={(e) => setSearchAction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип сущности" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-[200px]"
            />

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Поиск
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Логи ({pagination.total})</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Сущность</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>IP</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.entityType && (
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entityType)}
                        <span>{log.entityType}</span>
                        {log.entityId && (
                          <code className="text-xs bg-muted px-1 rounded">
                            {log.entityId.slice(0, 8)}...
                          </code>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.userEmail ? (
                      <span className="text-sm">{log.userEmail}</span>
                    ) : log.userId ? (
                      <code className="text-xs">{log.userId.slice(0, 8)}...</code>
                    ) : (
                      <span className="text-muted-foreground">Система</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.ipAddress || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      Детали
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Нет записей
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Страница {pagination.page} из {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог деталей */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали записи</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Время</p>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Действие</p>
                  <Badge variant={getActionBadgeColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Пользователь</p>
                  <p className="font-medium">{selectedLog.userEmail || selectedLog.userId || "Система"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP адрес</p>
                  <p className="font-medium">{selectedLog.ipAddress || "—"}</p>
                </div>
                {selectedLog.entityType && (
                  <div>
                    <p className="text-muted-foreground">Тип сущности</p>
                    <p className="font-medium">{selectedLog.entityType}</p>
                  </div>
                )}
                {selectedLog.entityId && (
                  <div>
                    <p className="text-muted-foreground">ID сущности</p>
                    <code className="text-sm">{selectedLog.entityId}</code>
                  </div>
                )}
              </div>

              {selectedLog.userAgent && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">User Agent</p>
                  <p className="text-xs bg-muted p-2 rounded break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.oldValue && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Старое значение</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px]">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Новое значение</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px]">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
