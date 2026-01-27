/**
 * Система автопродления серверов
 * Проверяет истекающие серверы и автоматически продлевает их
 */

import prisma from './db'
import { withdrawBalance } from './billing'
import { sendEmail } from './email'
import { ServerStatus, TransactionType, PaymentStatus } from '@prisma/client'

interface RenewalResult {
  serverId: string
  success: boolean
  error?: string
  newExpiresAt?: Date
}

/**
 * Получить серверы, которые истекают в ближайшие N дней
 */
export async function getExpiringServers(daysAhead: number = 3) {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  
  return prisma.server.findMany({
    where: {
      status: {
        in: [ServerStatus.ACTIVE, ServerStatus.SUSPENDED],
      },
      expiresAt: {
        lte: futureDate,
        gt: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          balance: true,
          notifyEmail: true,
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: { expiresAt: 'asc' },
  })
}

/**
 * Получить истекшие серверы
 */
export async function getExpiredServers() {
  return prisma.server.findMany({
    where: {
      status: ServerStatus.ACTIVE,
      expiresAt: {
        lt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          balance: true,
          notifyEmail: true,
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
  })
}

/**
 * Продлить сервер на 1 месяц
 */
export async function renewServer(serverId: string): Promise<RenewalResult> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: { select: { id: true, email: true, balance: true } },
        plan: { select: { price: true, name: true } },
      },
    })
    
    if (!server) {
      return { serverId, success: false, error: 'Server not found' }
    }
    
    if (!server.autoRenew) {
      return { serverId, success: false, error: 'Auto-renew disabled' }
    }
    
    const price = server.plan.price
    
    // Проверяем баланс
    if (server.user.balance < price) {
      return { serverId, success: false, error: 'Insufficient balance' }
    }
    
    // Списываем средства
    await withdrawBalance(
      server.user.id,
      price,
      `Автопродление сервера "${server.name}" (${server.plan.name})`
    )
    
    // Продлеваем сервер на 30 дней
    const currentExpiry = new Date(server.expiresAt)
    const newExpiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    await prisma.server.update({
      where: { id: serverId },
      data: {
        expiresAt: newExpiresAt,
        status: ServerStatus.ACTIVE, // Если был suspended - активируем
        suspendedAt: null,
      },
    })
    
    return { serverId, success: true, newExpiresAt }
  } catch (error) {
    console.error(`Error renewing server ${serverId}:`, error)
    return {
      serverId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Приостановить истекший сервер
 */
export async function suspendExpiredServer(serverId: string) {
  return prisma.server.update({
    where: { id: serverId },
    data: {
      status: ServerStatus.SUSPENDED,
      suspendedAt: new Date(),
    },
  })
}

/**
 * Удалить сервер после длительной приостановки (7+ дней)
 */
export async function terminateAbandonedServers(daysAfterSuspension: number = 7) {
  const cutoffDate = new Date(Date.now() - daysAfterSuspension * 24 * 60 * 60 * 1000)
  
  const serversToTerminate = await prisma.server.findMany({
    where: {
      status: ServerStatus.SUSPENDED,
      suspendedAt: {
        lt: cutoffDate,
      },
    },
  })
  
  for (const server of serversToTerminate) {
    await prisma.server.update({
      where: { id: server.id },
      data: { status: ServerStatus.TERMINATED },
    })
    
    // TODO: Удалить сервер с Pterodactyl Panel
  }
  
  return serversToTerminate.length
}

/**
 * Главная функция обработки продлений (запускать по cron)
 */
export async function processServerRenewals() {
  const results = {
    renewed: 0,
    suspended: 0,
    notificationsSent: 0,
    errors: [] as string[],
  }
  
  // 1. Обрабатываем истекшие серверы
  const expiredServers = await getExpiredServers()
  
  for (const server of expiredServers) {
    if (server.autoRenew) {
      // Пробуем продлить
      const result = await renewServer(server.id)
      
      if (result.success) {
        results.renewed++
        
        // Отправляем уведомление об успешном продлении
        if (server.user.notifyEmail) {
          await sendEmail({
            to: server.user.email,
            subject: `Сервер "${server.name}" успешно продлён`,
            template: 'server-renewed',
            data: {
              userName: server.user.name || server.user.email,
              serverName: server.name,
              planName: server.plan.name,
              newExpiresAt: result.newExpiresAt?.toLocaleDateString('ru-RU'),
              amount: server.plan.price,
            },
          })
          results.notificationsSent++
        }
      } else {
        // Не удалось продлить - приостанавливаем
        await suspendExpiredServer(server.id)
        results.suspended++
        
        // Уведомление о приостановке
        if (server.user.notifyEmail) {
          await sendEmail({
            to: server.user.email,
            subject: `Сервер "${server.name}" приостановлен`,
            template: 'server-suspended',
            data: {
              userName: server.user.name || server.user.email,
              serverName: server.name,
              reason: result.error === 'Insufficient balance' 
                ? 'Недостаточно средств на балансе' 
                : 'Ошибка продления',
              requiredAmount: server.plan.price,
              currentBalance: server.user.balance,
            },
          })
          results.notificationsSent++
        }
      }
    } else {
      // Автопродление выключено - сразу приостанавливаем
      await suspendExpiredServer(server.id)
      results.suspended++
    }
  }
  
  // 2. Отправляем напоминания о скором истечении
  const expiringServers = await getExpiringServers(3)
  
  for (const server of expiringServers) {
    // Проверяем, не отправляли ли уже напоминание сегодня
    const daysUntilExpiry = Math.ceil(
      (new Date(server.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    )
    
    // Отправляем за 3 дня и за 1 день
    if (daysUntilExpiry === 3 || daysUntilExpiry === 1) {
      if (server.user.notifyEmail) {
        const canAutoRenew = server.autoRenew && server.user.balance >= server.plan.price
        
        await sendEmail({
          to: server.user.email,
          subject: `Сервер "${server.name}" истекает через ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'день' : 'дня'}`,
          template: 'server-expiring',
          data: {
            userName: server.user.name || server.user.email,
            serverName: server.name,
            planName: server.plan.name,
            expiresAt: new Date(server.expiresAt).toLocaleDateString('ru-RU'),
            daysLeft: daysUntilExpiry,
            autoRenew: server.autoRenew,
            canAutoRenew,
            requiredAmount: server.plan.price,
            currentBalance: server.user.balance,
          },
        })
        results.notificationsSent++
      }
    }
  }
  
  // 3. Удаляем заброшенные серверы
  const terminated = await terminateAbandonedServers()
  
  return {
    ...results,
    terminated,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Переключить автопродление для сервера
 */
export async function toggleAutoRenew(serverId: string, userId: string, enabled: boolean) {
  const server = await prisma.server.findFirst({
    where: {
      id: serverId,
      userId,
    },
  })
  
  if (!server) {
    throw new Error('Server not found')
  }
  
  return prisma.server.update({
    where: { id: serverId },
    data: { autoRenew: enabled },
  })
}
