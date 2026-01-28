"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
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
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Server, 
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnalyticsData {
  revenue: {
    total: number
    monthly: { month: string; amount: number }[]
    growth: number
  }
  users: {
    total: number
    new: number
    active: number
    growth: number
    registrations: { date: string; count: number }[]
  }
  servers: {
    total: number
    active: number
    byPlan: { name: string; count: number }[]
    byLocation: { name: string; count: number }[]
  }
  tickets: {
    total: number
    open: number
    avgResponseTime: number
    byStatus: { status: string; count: number }[]
  }
  funnel: {
    visitors: number
    registered: number
    firstPayment: number
    active: number
  }
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F"]

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/analytics/dashboard?period=${period}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      }
      setLoading(false)
    }
    fetchAnalytics()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Не удалось загрузить аналитику
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Аналитика</h1>
          <p className="text-muted-foreground">Статистика и метрики проекта</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Период" />
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Общий доход"
          value={`${data.revenue.total.toLocaleString("ru-RU")} ₽`}
          change={data.revenue.growth}
          icon={DollarSign}
          color="text-green-600"
        />
        <MetricCard
          title="Пользователи"
          value={data.users.total.toLocaleString()}
          change={data.users.growth}
          subtext={`+${data.users.new} новых`}
          icon={Users}
          color="text-blue-600"
        />
        <MetricCard
          title="Серверы"
          value={data.servers.total.toLocaleString()}
          subtext={`${data.servers.active} активных`}
          icon={Server}
          color="text-purple-600"
        />
        <MetricCard
          title="Тикеты"
          value={data.tickets.total.toLocaleString()}
          subtext={`${data.tickets.open} открытых`}
          icon={Ticket}
          color="text-orange-600"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">💰 Доходы</TabsTrigger>
          <TabsTrigger value="users">👥 Пользователи</TabsTrigger>
          <TabsTrigger value="servers">🖥️ Серверы</TabsTrigger>
          <TabsTrigger value="funnel">📈 Воронка</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>График доходов</CardTitle>
              <CardDescription>Ежемесячный доход за выбранный период</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.revenue.monthly}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString("ru-RU")} ₽`, "Доход"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Регистрации</CardTitle>
                <CardDescription>Новые пользователи по дням</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.users.registrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Активность</CardTitle>
                <CardDescription>Соотношение активных пользователей</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Активные", value: data.users.active },
                        { name: "Неактивные", value: data.users.total - data.users.active },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#d1d5db" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servers">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>По тарифам</CardTitle>
                <CardDescription>Распределение серверов по планам</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.servers.byPlan}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {data.servers.byPlan.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>По локациям</CardTitle>
                <CardDescription>Распределение серверов по регионам</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.servers.byLocation} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Воронка конверсий</CardTitle>
              <CardDescription>Путь пользователя от посещения до активного клиента</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FunnelStep
                  label="Посетители"
                  value={data.funnel.visitors}
                  percentage={100}
                  color="bg-blue-500"
                />
                <FunnelStep
                  label="Зарегистрировались"
                  value={data.funnel.registered}
                  percentage={(data.funnel.registered / data.funnel.visitors) * 100}
                  color="bg-purple-500"
                />
                <FunnelStep
                  label="Первый платёж"
                  value={data.funnel.firstPayment}
                  percentage={(data.funnel.firstPayment / data.funnel.visitors) * 100}
                  color="bg-orange-500"
                />
                <FunnelStep
                  label="Активные клиенты"
                  value={data.funnel.active}
                  percentage={(data.funnel.active / data.funnel.visitors) * 100}
                  color="bg-green-500"
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-purple-600">
                    {((data.funnel.registered / data.funnel.visitors) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Регистрация</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-orange-600">
                    {((data.funnel.firstPayment / data.funnel.registered) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Конверсия в оплату</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-green-600">
                    {((data.funnel.active / data.funnel.firstPayment) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Удержание</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  change?: number
  subtext?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function MetricCard({ title, value, change, subtext, icon: Icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtext && !change && (
              <p className="text-sm text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-muted ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FunnelStepProps {
  label: string
  value: number
  percentage: number
  color: string
}

function FunnelStep({ label, value, percentage, color }: FunnelStepProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-8 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
