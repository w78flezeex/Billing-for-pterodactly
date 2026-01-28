import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { TransactionType, PaymentStatus } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    
    let newAlerts = 0
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // 1. Check for velocity - too many transactions in short time
    const velocityUsers = await prisma.user.findMany({
      where: {
        transactions: {
          some: {
            createdAt: { gte: oneDayAgo },
          },
        },
      },
      include: {
        transactions: {
          where: { createdAt: { gte: oneDayAgo } },
        },
        fraudAlerts: {
          where: {
            type: "VELOCITY",
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
    })
    
    for (const user of velocityUsers) {
      if (user.transactions.length > 10 && user.fraudAlerts.length === 0) {
        await prisma.fraudAlert.create({
          data: {
            userId: user.id,
            type: "VELOCITY",
            severity: user.transactions.length > 20 ? "HIGH" : "MEDIUM",
            description: `${user.transactions.length} транзакций за последние 24 часа`,
            metadata: {
              transactionCount: user.transactions.length,
              totalAmount: user.transactions.reduce((s, t) => s + Math.abs(t.amount), 0),
            },
          },
        })
        newAlerts++
      }
    }
    
    // 2. Check for suspicious large payments
    const largePayments = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        type: TransactionType.DEPOSIT,
        amount: { gte: 50000 },
        status: PaymentStatus.COMPLETED,
      },
      include: {
        user: {
          include: {
            fraudAlerts: {
              where: {
                type: "SUSPICIOUS_PAYMENT",
                createdAt: { gte: sevenDaysAgo },
              },
            },
          },
        },
      },
    })
    
    for (const tx of largePayments) {
      if (tx.user.fraudAlerts.length === 0) {
        await prisma.fraudAlert.create({
          data: {
            userId: tx.userId,
            type: "SUSPICIOUS_PAYMENT",
            severity: tx.amount >= 100000 ? "HIGH" : "MEDIUM",
            description: `Крупный платёж на сумму ${tx.amount.toLocaleString("ru-RU")} ₽`,
            metadata: {
              transactionId: tx.id,
              amount: tx.amount,
              paymentMethod: tx.paymentMethod,
            },
          },
        })
        newAlerts++
      }
    }
    
    // 3. Check for multiple accounts (same IP)
    const recentLogins = await prisma.loginHistory.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { userId: true, ipAddress: true },
    })
    
    const ipUserMap = new Map<string, Set<string>>()
    for (const login of recentLogins) {
      if (!login.ipAddress) continue
      if (!ipUserMap.has(login.ipAddress)) {
        ipUserMap.set(login.ipAddress, new Set())
      }
      ipUserMap.get(login.ipAddress)!.add(login.userId)
    }
    
    for (const [ip, userIds] of ipUserMap.entries()) {
      if (userIds.size >= 3) {
        // Check if alert already exists
        const existingAlert = await prisma.fraudAlert.findFirst({
          where: {
            type: "MULTIPLE_ACCOUNTS",
            metadata: { path: ["ipAddress"], equals: ip },
            createdAt: { gte: thirtyDaysAgo },
          },
        })
        
        if (!existingAlert) {
          // Create alert for first user
          const firstUserId = Array.from(userIds)[0]
          await prisma.fraudAlert.create({
            data: {
              userId: firstUserId,
              type: "MULTIPLE_ACCOUNTS",
              severity: userIds.size >= 5 ? "HIGH" : "MEDIUM",
              description: `${userIds.size} аккаунтов с одного IP: ${ip}`,
              metadata: {
                ipAddress: ip,
                userCount: userIds.size,
                userIds: Array.from(userIds),
              },
            },
          })
          newAlerts++
        }
      }
    }
    
    // 4. Check for unusual activity patterns
    const inactiveWithSuddenDeposit = await prisma.user.findMany({
      where: {
        lastLoginAt: { lt: thirtyDaysAgo },
        transactions: {
          some: {
            createdAt: { gte: sevenDaysAgo },
            type: TransactionType.DEPOSIT,
            amount: { gte: 5000 },
          },
        },
      },
      include: {
        fraudAlerts: {
          where: {
            type: "UNUSUAL_ACTIVITY",
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    })
    
    for (const user of inactiveWithSuddenDeposit) {
      if (user.fraudAlerts.length === 0) {
        await prisma.fraudAlert.create({
          data: {
            userId: user.id,
            type: "UNUSUAL_ACTIVITY",
            severity: "LOW",
            description: "Неактивный аккаунт внезапно пополнил баланс",
            metadata: {
              lastLogin: user.lastLoginAt,
            },
          },
        })
        newAlerts++
      }
    }
    
    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "FRAUD_SCAN_RUN",
        details: { newAlerts },
      },
    })
    
    return NextResponse.json({ newAlerts })
    
  } catch (error: unknown) {
    console.error("Fraud scan error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка сканирования" },
      { status: 500 }
    )
  }
}
