/**
 * Система инвойсов
 * Генерация, хранение и отправка счетов
 */

import prisma from './db'
import { InvoiceStatus } from '@prisma/client'
import { sendEmail } from './email'

interface InvoiceItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
}

interface CreateInvoiceParams {
  userId: string
  items: InvoiceItem[]
  description?: string
  dueDate?: Date
  tax?: number
}

/**
 * Генерировать номер инвойса
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  
  // Находим последний инвойс этого года
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      number: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.number.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

/**
 * Создать инвойс
 */
export async function createInvoice(params: CreateInvoiceParams) {
  const { userId, items, description, dueDate, tax = 0 } = params
  
  const amount = items.reduce((sum, item) => sum + item.total, 0)
  const number = await generateInvoiceNumber()
  
  const invoice = await prisma.invoice.create({
    data: {
      number,
      userId,
      amount,
      tax,
      description,
      items: items as any,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      status: InvoiceStatus.UNPAID,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          company: true,
        },
      },
    },
  })
  
  return invoice
}

/**
 * Отметить инвойс как оплаченный
 */
export async function markInvoicePaid(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
    },
  })
}

/**
 * Отменить инвойс
 */
export async function cancelInvoice(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.CANCELLED,
    },
  })
}

/**
 * Проверить просроченные инвойсы
 */
export async function checkOverdueInvoices() {
  const overdueInvoices = await prisma.invoice.updateMany({
    where: {
      status: InvoiceStatus.UNPAID,
      dueDate: { lt: new Date() },
    },
    data: {
      status: InvoiceStatus.OVERDUE,
    },
  })
  
  return overdueInvoices.count
}

/**
 * Получить инвойсы пользователя
 */
export async function getUserInvoices(userId: string) {
  return prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Получить инвойс по номеру
 */
export async function getInvoiceByNumber(number: string) {
  return prisma.invoice.findUnique({
    where: { number },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          company: true,
          phone: true,
        },
      },
    },
  })
}

/**
 * Генерировать HTML для инвойса (для PDF конвертации)
 */
export function generateInvoiceHTML(invoice: {
  number: string
  amount: number
  tax: number
  items: InvoiceItem[]
  description?: string | null
  createdAt: Date
  dueDate: Date
  paidAt?: Date | null
  status: InvoiceStatus
  user: {
    name?: string | null
    email: string
    company?: string | null
    phone?: string | null
  }
}): string {
  const items = invoice.items as InvoiceItem[]
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal + invoice.tax
  
  const statusColors: Record<InvoiceStatus, string> = {
    UNPAID: '#f59e0b',
    PAID: '#22c55e',
    OVERDUE: '#ef4444',
    CANCELLED: '#6b7280',
  }
  
  const statusLabels: Record<InvoiceStatus, string> = {
    UNPAID: 'Не оплачен',
    PAID: 'Оплачен',
    OVERDUE: 'Просрочен',
    CANCELLED: 'Отменён',
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px; 
      color: #1f2937;
      background: #fff;
    }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; }
    .invoice-date { color: #6b7280; margin-top: 4px; }
    .status { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: 12px;
      font-weight: 600;
      color: white;
      margin-top: 8px;
    }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { flex: 1; }
    .party-title { font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; }
    .party-name { font-size: 18px; font-weight: 600; }
    .party-details { color: #6b7280; margin-top: 4px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { 
      background: #f3f4f6; 
      padding: 12px; 
      text-align: left; 
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
    }
    td { padding: 16px 12px; border-bottom: 1px solid #e5e7eb; }
    .item-name { font-weight: 500; }
    .item-desc { font-size: 13px; color: #6b7280; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { 
      border-top: 2px solid #1f2937; 
      font-size: 18px; 
      font-weight: bold; 
      margin-top: 8px;
      padding-top: 12px;
    }
    .footer { 
      margin-top: 60px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .payment-info {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .payment-title { font-weight: 600; margin-bottom: 8px; color: #0369a1; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">🖥️ Hosting Service</div>
        <div style="color: #6b7280; margin-top: 8px;">hosting.example.com</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${invoice.number}</div>
        <div class="invoice-date">от ${new Date(invoice.createdAt).toLocaleDateString('ru-RU')}</div>
        <div class="status" style="background: ${statusColors[invoice.status]}">
          ${statusLabels[invoice.status]}
        </div>
      </div>
    </div>
    
    <div class="parties">
      <div class="party">
        <div class="party-title">От</div>
        <div class="party-name">Hosting Service</div>
        <div class="party-details">
          ИП Иванов И.И.<br>
          ИНН: 123456789012<br>
          support@hosting.example.com
        </div>
      </div>
      <div class="party">
        <div class="party-title">Кому</div>
        <div class="party-name">${invoice.user.company || invoice.user.name || 'Клиент'}</div>
        <div class="party-details">
          ${invoice.user.name || ''}<br>
          ${invoice.user.email}<br>
          ${invoice.user.phone || ''}
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Услуга</th>
          <th class="text-right">Кол-во</th>
          <th class="text-right">Цена</th>
          <th class="text-right">Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <div class="item-name">${item.name}</div>
              ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${item.unitPrice.toLocaleString('ru-RU')} ₽</td>
            <td class="text-right">${item.total.toLocaleString('ru-RU')} ₽</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="total-row">
        <span>Подытог:</span>
        <span>${subtotal.toLocaleString('ru-RU')} ₽</span>
      </div>
      ${invoice.tax > 0 ? `
        <div class="total-row">
          <span>НДС:</span>
          <span>${invoice.tax.toLocaleString('ru-RU')} ₽</span>
        </div>
      ` : ''}
      <div class="total-row final">
        <span>Итого:</span>
        <span>${total.toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>
    
    ${invoice.status === 'UNPAID' || invoice.status === 'OVERDUE' ? `
      <div class="payment-info">
        <div class="payment-title">Информация об оплате</div>
        <div>Срок оплаты: ${new Date(invoice.dueDate).toLocaleDateString('ru-RU')}</div>
        <div style="margin-top: 8px;">
          Оплатите счёт через личный кабинет или пополните баланс на сумму счёта.
        </div>
      </div>
    ` : ''}
    
    ${invoice.status === 'PAID' && invoice.paidAt ? `
      <div class="payment-info" style="background: #f0fdf4; border-color: #bbf7d0;">
        <div class="payment-title" style="color: #15803d;">Счёт оплачен</div>
        <div>Дата оплаты: ${new Date(invoice.paidAt).toLocaleDateString('ru-RU')}</div>
      </div>
    ` : ''}
    
    <div class="footer">
      <p>Спасибо за использование наших услуг!</p>
      <p style="margin-top: 8px;">По вопросам обращайтесь: support@hosting.example.com</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Отправить инвойс на email
 */
export async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          company: true,
          phone: true,
        },
      },
    },
  })
  
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  
  const html = generateInvoiceHTML({
    ...invoice,
    items: invoice.items as unknown as InvoiceItem[],
  })
  
  await sendEmail({
    to: invoice.user.email,
    subject: `Счёт ${invoice.number} на сумму ${invoice.amount.toLocaleString('ru-RU')} ₽`,
    template: 'invoice',
    data: {
      invoiceNumber: invoice.number,
      amount: invoice.amount,
      dueDate: new Date(invoice.dueDate).toLocaleDateString('ru-RU'),
      userName: invoice.user.name || invoice.user.email,
    },
    attachments: [
      {
        filename: `${invoice.number}.html`,
        content: html,
        contentType: 'text/html',
      },
    ],
  })
  
  return invoice
}
