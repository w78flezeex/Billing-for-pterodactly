/**
 * Экспорт данных в CSV/Excel
 */

import prisma from './db'
import { PaymentStatus, ServerStatus } from '@prisma/client'

type ExportFormat = 'csv' | 'json'

interface ExportOptions {
  format: ExportFormat
  dateFrom?: Date
  dateTo?: Date
  userId?: string // Для экспорта данных конкретного пользователя
}

/**
 * Преобразовать массив объектов в CSV
 */
function toCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return ''
  
  const headers = columns || Object.keys(data[0])
  const rows = data.map(item => 
    headers.map(header => {
      let value = item[header]
      
      // Обработка дат
      if (value instanceof Date) {
        value = value.toISOString()
      }
      
      // Обработка объектов
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value)
      }
      
      // Экранирование для CSV
      const str = String(value ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Экспорт транзакций
 */
export async function exportTransactions(options: ExportOptions): Promise<string> {
  const { format, dateFrom, dateTo, userId } = options
  
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(userId && { userId }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
      status: PaymentStatus.COMPLETED,
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const data = transactions.map(tx => ({
    'ID': tx.id,
    'Дата': new Date(tx.createdAt).toLocaleString('ru-RU'),
    'Пользователь': tx.user.email,
    'Имя': tx.user.name || '',
    'Тип': getTransactionTypeName(tx.type),
    'Сумма': tx.amount,
    'Баланс до': tx.balanceBefore,
    'Баланс после': tx.balanceAfter,
    'Описание': tx.description || '',
    'Метод оплаты': tx.paymentMethod || '',
    'Статус': tx.status,
  }))
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }
  
  return toCSV(data)
}

/**
 * Экспорт пользователей
 */
export async function exportUsers(options: ExportOptions): Promise<string> {
  const { format, dateFrom, dateTo } = options
  
  const users = await prisma.user.findMany({
    where: {
      isDeleted: false,
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
    },
    include: {
      _count: {
        select: {
          servers: true,
          transactions: true,
          tickets: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const data = users.map(user => ({
    'ID': user.id,
    'Email': user.email,
    'Имя': user.name || '',
    'Компания': user.company || '',
    'Телефон': user.phone || '',
    'Роль': user.role,
    'Баланс': user.balance,
    'Серверов': user._count.servers,
    'Транзакций': user._count.transactions,
    'Тикетов': user._count.tickets,
    'Email подтверждён': user.emailVerified ? 'Да' : 'Нет',
    '2FA': user.twoFactorEnabled ? 'Да' : 'Нет',
    'Дата регистрации': new Date(user.createdAt).toLocaleString('ru-RU'),
    'Последний вход': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : '',
  }))
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }
  
  return toCSV(data)
}

/**
 * Экспорт серверов
 */
export async function exportServers(options: ExportOptions): Promise<string> {
  const { format, dateFrom, dateTo, userId } = options
  
  const servers = await prisma.server.findMany({
    where: {
      ...(userId && { userId }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
      plan: {
        select: { name: true, price: true },
      },
      location: {
        select: { name: true, country: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const data = servers.map(server => ({
    'ID': server.id,
    'Название': server.name,
    'Пользователь': server.user.email,
    'Тариф': server.plan.name,
    'Цена': server.plan.price,
    'Локация': server.location?.name || '',
    'Страна': server.location?.country || '',
    'IP': server.ipAddress || '',
    'Порт': server.port || '',
    'Статус': getServerStatusName(server.status),
    'Автопродление': server.autoRenew ? 'Да' : 'Нет',
    'Истекает': new Date(server.expiresAt).toLocaleString('ru-RU'),
    'Создан': new Date(server.createdAt).toLocaleString('ru-RU'),
  }))
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }
  
  return toCSV(data)
}

/**
 * Экспорт инвойсов
 */
export async function exportInvoices(options: ExportOptions): Promise<string> {
  const { format, dateFrom, dateTo, userId } = options
  
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(userId && { userId }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
    },
    include: {
      user: {
        select: { email: true, name: true, company: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const data = invoices.map(invoice => ({
    'Номер': invoice.number,
    'Пользователь': invoice.user.email,
    'Компания': invoice.user.company || '',
    'Сумма': invoice.amount,
    'НДС': invoice.tax,
    'Итого': invoice.amount + invoice.tax,
    'Статус': getInvoiceStatusName(invoice.status),
    'Описание': invoice.description || '',
    'Дата создания': new Date(invoice.createdAt).toLocaleString('ru-RU'),
    'Срок оплаты': new Date(invoice.dueDate).toLocaleString('ru-RU'),
    'Дата оплаты': invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('ru-RU') : '',
  }))
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }
  
  return toCSV(data)
}

/**
 * Экспорт финансового отчёта
 */
export async function exportFinancialReport(options: ExportOptions): Promise<string> {
  const { format, dateFrom, dateTo } = options
  
  const startDate = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const endDate = dateTo || new Date()
  
  // Получаем агрегированные данные
  const transactions = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: PaymentStatus.COMPLETED,
    },
    _sum: { amount: true },
    _count: { id: true },
  })
  
  const data = transactions.map(item => ({
    'Тип операции': getTransactionTypeName(item.type),
    'Количество': item._count.id,
    'Сумма': item._sum.amount || 0,
  }))
  
  // Добавляем итоги
  const totalIncome = transactions
    .filter(t => (t._sum.amount || 0) > 0)
    .reduce((sum, t) => sum + (t._sum.amount || 0), 0)
  
  const totalExpense = transactions
    .filter(t => (t._sum.amount || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t._sum.amount || 0), 0)
  
  data.push(
    { 'Тип операции': '---', 'Количество': 0, 'Сумма': 0 },
    { 'Тип операции': 'ИТОГО ДОХОД', 'Количество': 0, 'Сумма': totalIncome },
    { 'Тип операции': 'ИТОГО РАСХОД', 'Количество': 0, 'Сумма': totalExpense },
    { 'Тип операции': 'БАЛАНС', 'Количество': 0, 'Сумма': totalIncome - totalExpense },
  )
  
  if (format === 'json') {
    return JSON.stringify({
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      transactions: data,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    }, null, 2)
  }
  
  // Добавляем заголовок с периодом
  const header = `Финансовый отчёт\nПериод: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}\n\n`
  return header + toCSV(data)
}

// Вспомогательные функции для названий
function getTransactionTypeName(type: string): string {
  const names: Record<string, string> = {
    DEPOSIT: 'Пополнение',
    WITHDRAWAL: 'Вывод',
    PURCHASE: 'Покупка',
    REFUND: 'Возврат',
    REFERRAL: 'Реферальный бонус',
    PROMOCODE: 'Промокод',
    BONUS: 'Бонус',
    RENEWAL: 'Продление',
  }
  return names[type] || type
}

function getServerStatusName(status: string): string {
  const names: Record<string, string> = {
    PENDING: 'Ожидание',
    INSTALLING: 'Установка',
    ACTIVE: 'Активен',
    SUSPENDED: 'Приостановлен',
    EXPIRED: 'Истёк',
    TERMINATED: 'Удалён',
  }
  return names[status] || status
}

function getInvoiceStatusName(status: string): string {
  const names: Record<string, string> = {
    UNPAID: 'Не оплачен',
    PAID: 'Оплачен',
    OVERDUE: 'Просрочен',
    CANCELLED: 'Отменён',
  }
  return names[status] || status
}
