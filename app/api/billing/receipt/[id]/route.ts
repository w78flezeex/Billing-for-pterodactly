import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"
import { siteConfig } from "@/lib/config"

// GET - Получить PDF чек
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, company: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 })
    }

    // Проверяем права доступа
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (transaction.userId !== user.id && dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    if (transaction.status !== "COMPLETED") {
      return NextResponse.json({ error: "Чек доступен только для завершённых платежей" }, { status: 400 })
    }

    // Генерируем HTML чек (можно конвертировать в PDF на клиенте или через puppeteer)
    const receiptHtml = generateReceiptHtml(transaction)

    // Возвращаем HTML для печати/сохранения как PDF
    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${id}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating receipt:", error)
    return NextResponse.json({ error: "Ошибка" }, { status: 500 })
  }
}

function generateReceiptHtml(transaction: any): string {
  const date = new Date(transaction.createdAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const typeLabels: Record<string, string> = {
    DEPOSIT: "Пополнение баланса",
    PURCHASE: "Покупка услуги",
    REFUND: "Возврат средств",
    BONUS: "Бонусное начисление",
    REFERRAL: "Реферальный бонус",
    PROMOCODE: "Промокод",
  }

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Чек #${transaction.id.slice(-8).toUpperCase()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .status {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
    }
    .content {
      padding: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #666;
      font-size: 14px;
    }
    .value {
      font-weight: 600;
      font-size: 14px;
    }
    .amount-row {
      background: #f8f9fa;
      margin: 16px -24px;
      padding: 20px 24px;
    }
    .amount-row .value {
      font-size: 24px;
      color: #22c55e;
    }
    .footer {
      text-align: center;
      padding: 20px 24px;
      border-top: 1px dashed #ddd;
      color: #999;
      font-size: 12px;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: #f0f0f0;
      margin: 0 auto 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${siteConfig.siteName}</h1>
      <p>Электронный чек</p>
      <div class="status">✓ Оплачено</div>
    </div>
    
    <div class="content">
      <div class="row">
        <span class="label">Номер чека</span>
        <span class="value">#${transaction.id.slice(-8).toUpperCase()}</span>
      </div>
      
      <div class="row">
        <span class="label">Дата</span>
        <span class="value">${date}</span>
      </div>
      
      <div class="row">
        <span class="label">Тип операции</span>
        <span class="value">${typeLabels[transaction.type] || transaction.type}</span>
      </div>
      
      <div class="row">
        <span class="label">Клиент</span>
        <span class="value">${transaction.user.name}</span>
      </div>
      
      <div class="row">
        <span class="label">Email</span>
        <span class="value">${transaction.user.email}</span>
      </div>
      
      ${transaction.paymentMethod ? `
      <div class="row">
        <span class="label">Способ оплаты</span>
        <span class="value">${transaction.paymentMethod}</span>
      </div>
      ` : ""}
      
      ${transaction.description ? `
      <div class="row">
        <span class="label">Описание</span>
        <span class="value">${transaction.description}</span>
      </div>
      ` : ""}
      
      <div class="row amount-row">
        <span class="label">Сумма</span>
        <span class="value">${transaction.amount > 0 ? "+" : ""}${transaction.amount.toFixed(2)} ₽</span>
      </div>
      
      <div class="row">
        <span class="label">Баланс до</span>
        <span class="value">${transaction.balanceBefore.toFixed(2)} ₽</span>
      </div>
      
      <div class="row">
        <span class="label">Баланс после</span>
        <span class="value">${transaction.balanceAfter.toFixed(2)} ₽</span>
      </div>
    </div>
    
    <div class="footer">
      <div class="qr-placeholder">QR</div>
      <p>Спасибо за выбор ${siteConfig.siteName}!</p>
      <p style="margin-top: 8px;">ID: ${transaction.id}</p>
    </div>
  </div>
  
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    ">
      Скачать PDF / Распечатать
    </button>
  </div>
</body>
</html>
  `
}
