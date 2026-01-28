"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import {
  ArrowLeft,
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ReportData {
  summary: {
    totalRevenue: number
    totalDeposits: number
    totalRefunds: number
    netRevenue: number
    mrr: number
    arr: number
    avgTransactionValue: number
    transactionCount: number
    newUsers: number
    churnedUsers: number
    growth: number
  }
  revenueByDay: { date: string; revenue: number; deposits: number; refunds: number }[]
  revenueByMonth: { month: string; revenue: number; deposits: number; refunds: number }[]
  paymentMethods: { method: string; count: number; amount: number }[]
  transactionTypes: { type: string; count: number; amount: number }[]
  topUsers: { id: string; email: string; name: string; totalSpent: number; transactionCount: number }[]
  hourlyDistribution: { hour: number; count: number; amount: number }[]
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function FinancialReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState("30d")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadReport()
  }, [period])

  const loadReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/reports/financial?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Error loading report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: "csv" | "json" | "pdf") => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ 
        period,
        format,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const res = await fetch(`/api/admin/reports/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `financial-report-${new Date().toISOString().split("T")[0]}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getGrowthBadge = (growth: number) => {
    if (growth > 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          +{growth.toFixed(1)}%
        </Badge>
      )
    } else if (growth < 0) {
      return (
        <Badge variant="destructive">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {growth.toFixed(1)}%
        </Badge>
      )
    }
    return <Badge variant="secondary">0%</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📊 Финансовые отчёты</h1>
            <p className="text-muted-foreground">Аналитика доходов, MRR, ARR и экспорт</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadReport()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="90d">90 дней</SelectItem>
              <SelectItem value="365d">1 год</SelectItem>
              <SelectItem value="all">Всё время</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт отчёта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Дата от</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>Дата до</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => exportReport("csv")}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport("json")}
              disabled={exporting}
            >
              JSON
            </Button>
            <Button
              onClick={() => exportReport("pdf")}
              disabled={exporting}
            >
              PDF отчёт
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getGrowthBadge(data.summary.growth)}
                    <span className="text-xs text-muted-foreground">vs прошлый период</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">MRR</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.summary.mrr)}</div>
                  <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">ARR</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.summary.arr)}</div>
                  <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Чистый доход</CardTitle>
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(data.summary.netRevenue)}</div>
                  <p className="text-xs text-muted-foreground">После возвратов</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Пополнения</p>
                    <p className="text-xl font-bold">{formatCurrency(data.summary.totalDeposits)}</p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Возвраты</p>
                    <p className="text-xl font-bold">{formatCurrency(data.summary.totalRefunds)}</p>
                  </div>
                  <ArrowDownRight className="h-8 w-8 text-red-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Транзакций</p>
                    <p className="text-xl font-bold">{data.summary.transactionCount}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Средний чек</p>
                    <p className="text-xl font-bold">{formatCurrency(data.summary.avgTransactionValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">📈 Доходы</TabsTrigger>
              <TabsTrigger value="methods">💳 Способы оплаты</TabsTrigger>
              <TabsTrigger value="types">📊 Типы транзакций</TabsTrigger>
              <TabsTrigger value="top">👥 Топ клиентов</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Динамика доходов</CardTitle>
                  <CardDescription>Пополнения и возвраты по дням</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={data.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="deposits"
                        name="Пополнения"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                        stroke="#82ca9d"
                      />
                      <Bar
                        dataKey="refunds"
                        name="Возвраты"
                        fill="#ff7300"
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Чистый доход"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methods">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>По количеству</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.paymentMethods}
                          dataKey="count"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.paymentMethods.map((entry, index) => (
                            <Cell key={entry.method} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>По сумме</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.paymentMethods} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="method" type="category" width={100} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill="#8884d8" name="Сумма" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="types">
              <Card>
                <CardHeader>
                  <CardTitle>Типы транзакций</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.transactionTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Количество" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="amount" name="Сумма" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top">
              <Card>
                <CardHeader>
                  <CardTitle>Топ клиентов по расходам</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Транзакций</TableHead>
                        <TableHead className="text-right">Потрачено</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topUsers.map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{user.name || "—"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-right">{user.transactionCount}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(user.totalSpent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Помесячная динамика</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Доход"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
