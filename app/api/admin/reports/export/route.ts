import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const period = searchParams.get("period") || "30d"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    
    // Calculate date range
    let startDate: Date
    let endDate = dateTo ? new Date(dateTo) : new Date()
    
    if (dateFrom) {
      startDate = new Date(dateFrom)
    } else {
      const periodDays: Record<string, number> = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "365d": 365,
        "all": 3650,
      }
      const days = periodDays[period] || 30
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    }
    
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: PaymentStatus.COMPLETED,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    
    const typeLabels: Record<string, string> = {
      DEPOSIT: "Пополнение",
      WITHDRAWAL: "Вывод",
      PURCHASE: "Покупка",
      REFUND: "Возврат",
      REFERRAL: "Реферал",
      PROMOCODE: "Промокод",
      BONUS: "Бонус",
    }
    
    if (format === "json") {
      const data = transactions.map(tx => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        user: tx.user.email,
        userName: tx.user.name,
        type: typeLabels[tx.type] || tx.type,
        amount: tx.amount,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        status: tx.status,
      }))
      
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="financial-report-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.json"`,
        },
      })
    }
    
    if (format === "csv") {
      const headers = ["ID", "Дата", "Пользователь", "Имя", "Тип", "Сумма", "Баланс до", "Баланс после", "Описание", "Метод оплаты", "Статус"]
      const rows = transactions.map(tx => [
        tx.id,
        tx.createdAt.toISOString(),
        tx.user.email,
        tx.user.name || "",
        typeLabels[tx.type] || tx.type,
        tx.amount.toString(),
        tx.balanceBefore.toString(),
        tx.balanceAfter.toString(),
        tx.description || "",
        tx.paymentMethod || "",
        tx.status,
      ].map(cell => {
        const str = String(cell)
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(","))
      
      const csv = [headers.join(","), ...rows].join("\n")
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="financial-report-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv"`,
        },
      })
    }
    
    if (format === "pdf") {
      // Generate HTML for PDF
      const totalDeposits = transactions
        .filter(t => t.type === TransactionType.DEPOSIT && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalRefunds = transactions
        .filter(t => t.type === TransactionType.REFUND)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      const netRevenue = totalDeposits - totalRefunds
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .period { color: #6b7280; margin-top: 8px; }
    .summary { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .stat-label { color: #6b7280; font-size: 14px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .amount-positive { color: #22c55e; }
    .amount-negative { color: #ef4444; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📊 Финансовый отчёт</div>
    <div class="period">Период: ${startDate.toLocaleDateString("ru-RU")} - ${endDate.toLocaleDateString("ru-RU")}</div>
  </div>
  
  <div class="summary">
    <div class="stat-card">
      <div class="stat-value">${totalDeposits.toLocaleString("ru-RU")} ₽</div>
      <div class="stat-label">Пополнения</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalRefunds.toLocaleString("ru-RU")} ₽</div>
      <div class="stat-label">Возвраты</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${netRevenue.toLocaleString("ru-RU")} ₽</div>
      <div class="stat-label">Чистый доход</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${transactions.length}</div>
      <div class="stat-label">Транзакций</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Дата</th>
        <th>Пользователь</th>
        <th>Тип</th>
        <th style="text-align: right;">Сумма</th>
        <th>Описание</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.slice(0, 100).map(tx => `
        <tr>
          <td>${tx.createdAt.toLocaleDateString("ru-RU")} ${tx.createdAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</td>
          <td>${tx.user.email}</td>
          <td>${typeLabels[tx.type] || tx.type}</td>
          <td style="text-align: right;" class="${tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
            ${tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString("ru-RU")} ₽
          </td>
          <td>${tx.description || "—"}</td>
        </tr>
      `).join("")}
      ${transactions.length > 100 ? `
        <tr>
          <td colspan="5" style="text-align: center; color: #6b7280;">
            ... и ещё ${transactions.length - 100} транзакций
          </td>
        </tr>
      ` : ""}
    </tbody>
  </table>
  
  <div class="footer">
    Сформировано: ${new Date().toLocaleString("ru-RU")}<br>
    Hosting Billing System
  </div>
</body>
</html>
      `
      
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="financial-report-${startDate.toISOString().split("T")[0]}.html"`,
        },
      })
    }
    
    return NextResponse.json({ error: "Неподдерживаемый формат" }, { status: 400 })
    
  } catch (error: unknown) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка экспорта" },
      { status: 500 }
    )
  }
}
