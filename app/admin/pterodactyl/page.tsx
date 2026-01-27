"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Loader2,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  MapPin,
  Box,
  Egg,
} from "lucide-react"

interface PterodactylStatus {
  connected: boolean
  version?: string
  nodes?: Array<{
    id: number
    name: string
    location: string
    memory: number
    disk: number
    servers: number
    status: string
  }>
  locations?: Array<{
    id: number
    short: string
    long: string
  }>
  nests?: Array<{
    id: number
    name: string
    eggs: number
  }>
}

export default function PterodactylSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<PterodactylStatus | null>(null)

  // Settings
  const [panelUrl, setPanelUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [clientKey, setClientKey] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings/pterodactyl")
      if (res.ok) {
        const data = await res.json()
        setPanelUrl(data.panelUrl || "")
        setApiKey(data.apiKey ? "***" + data.apiKey.slice(-4) : "")
        setClientKey(data.clientKey ? "***" + data.clientKey.slice(-4) : "")
        setStatus(data.status)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/admin/settings/pterodactyl/test", {
        method: "POST",
      })
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error("Test error:", error)
      setStatus({ connected: false })
    } finally {
      setTesting(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/pterodactyl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelUrl,
          apiKey: apiKey.startsWith("***") ? undefined : apiKey,
          clientKey: clientKey.startsWith("***") ? undefined : clientKey,
        }),
      })
      if (res.ok) {
        alert("Настройки сохранены")
        await testConnection()
      } else {
        const data = await res.json()
        alert(data.error || "Ошибка сохранения")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pterodactyl Panel</h1>
            <p className="text-muted-foreground">Настройка интеграции с панелью управления серверами</p>
          </div>
          <Badge variant={status?.connected ? "default" : "destructive"} className="ml-auto">
            {status?.connected ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Подключено
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Не подключено
              </>
            )}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки подключения</CardTitle>
              <CardDescription>
                Введите URL панели и API ключи для интеграции
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL панели</Label>
                <Input
                  type="url"
                  placeholder="https://panel.example.com"
                  value={panelUrl}
                  onChange={(e) => setPanelUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Полный URL вашей Pterodactyl панели без / в конце
                </p>
              </div>

              <div className="space-y-2">
                <Label>Application API Key</Label>
                <Input
                  type="password"
                  placeholder="ptla_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Admin → Application API → Create New (All Read & Write)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Client API Key</Label>
                <Input
                  type="password"
                  placeholder="ptlc_..."
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Account → API Credentials → Create API Key (полный доступ)
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Сохранить
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Проверить подключение
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Статус подключения</CardTitle>
            </CardHeader>
            <CardContent>
              {status?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Подключение установлено</span>
                  </div>
                  {status.version && (
                    <p className="text-sm text-muted-foreground">
                      Версия: {status.version}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Нет подключения</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nodes */}
        {status?.connected && status.nodes && status.nodes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Ноды ({status.nodes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Локация</TableHead>
                    <TableHead>Память</TableHead>
                    <TableHead>Диск</TableHead>
                    <TableHead>Серверов</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-mono">{node.id}</TableCell>
                      <TableCell className="font-medium">{node.name}</TableCell>
                      <TableCell>{node.location}</TableCell>
                      <TableCell>{(node.memory / 1024).toFixed(1)} GB</TableCell>
                      <TableCell>{(node.disk / 1024).toFixed(1)} GB</TableCell>
                      <TableCell>{node.servers}</TableCell>
                      <TableCell>
                        <Badge variant={node.status === "online" ? "default" : "destructive"}>
                          {node.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        {status?.connected && status.locations && status.locations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Локации ({status.locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {status.locations.map((loc) => (
                  <Badge key={loc.id} variant="outline">
                    {loc.short} - {loc.long}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nests */}
        {status?.connected && status.nests && status.nests.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Nests ({status.nests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {status.nests.map((nest) => (
                  <div key={nest.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{nest.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {nest.id}</p>
                    </div>
                    <Badge variant="outline">
                      <Egg className="h-3 w-3 mr-1" />
                      {nest.eggs} eggs
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
