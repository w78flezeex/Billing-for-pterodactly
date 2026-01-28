import { baseTemplate } from "./base"

// ==================== WELCOME EMAIL ====================
export function welcomeEmail(data: {
  userName: string
  email: string
  loginUrl: string
}): string {
  const content = `
    <h1>Добро пожаловать в CloudHost! 🎉</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Мы рады приветствовать вас в CloudHost — надёжном облачном хостинге для ваших проектов. Ваш аккаунт успешно создан и готов к использованию.</p>
    
    <div class="info-box">
      <p><strong>Email:</strong> ${data.email}</p>
    </div>
    
    <p>Что вы можете сделать прямо сейчас:</p>
    <ul style="color:#52525b;line-height:1.8;">
      <li>🚀 Создать свой первый VDS/VPS сервер</li>
      <li>💰 Пополнить баланс для оплаты услуг</li>
      <li>📚 Изучить документацию и туториалы</li>
      <li>💬 Присоединиться к нашему сообществу</li>
    </ul>
    
    <div class="button-container">
      <a href="${data.loginUrl}" class="button">Войти в личный кабинет</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Если у вас возникнут вопросы, наша служба поддержки всегда готова помочь. Создайте тикет или напишите нам в Discord.</p>
  `

  return baseTemplate(content, "Добро пожаловать в CloudHost! Ваш аккаунт готов к использованию.")
}

// ==================== EMAIL VERIFICATION ====================
export function verificationEmail(data: {
  userName: string
  verificationCode: string
  verificationUrl: string
  expiresIn: string
}): string {
  const content = `
    <h1>Подтвердите ваш email 📧</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Для завершения регистрации необходимо подтвердить ваш email адрес. Нажмите на кнопку ниже или введите код вручную.</p>
    
    <div class="button-container">
      <a href="${data.verificationUrl}" class="button">Подтвердить email</a>
    </div>
    
    <p style="text-align:center;color:#71717a;font-size:14px;">Или введите код вручную:</p>
    
    <div class="code-block" style="text-align:center;font-size:32px;letter-spacing:8px;color:#ffffff;">
      ${data.verificationCode}
    </div>
    
    <div class="warning-box">
      <p>⏰ Код действителен в течение <strong>${data.expiresIn}</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Если вы не регистрировались на CloudHost, просто проигнорируйте это письмо.</p>
  `

  return baseTemplate(content, "Подтвердите ваш email для CloudHost")
}

// ==================== PASSWORD RESET ====================
export function passwordResetEmail(data: {
  userName: string
  resetUrl: string
  expiresIn: string
  ipAddress: string
}): string {
  const content = `
    <h1>Сброс пароля 🔐</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Мы получили запрос на сброс пароля для вашего аккаунта CloudHost. Если это были вы, нажмите на кнопку ниже для создания нового пароля.</p>
    
    <div class="button-container">
      <a href="${data.resetUrl}" class="button">Сбросить пароль</a>
    </div>
    
    <table class="data-table">
      <tr>
        <td class="label">IP адрес запроса:</td>
        <td class="value">${data.ipAddress}</td>
      </tr>
      <tr>
        <td class="label">Действует:</td>
        <td class="value">${data.expiresIn}</td>
      </tr>
    </table>
    
    <div class="warning-box">
      <p>⚠️ Если вы не запрашивали сброс пароля, немедленно смените пароль и проверьте безопасность аккаунта!</p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Ссылка для сброса пароля может быть использована только один раз.</p>
  `

  return baseTemplate(content, "Запрос на сброс пароля CloudHost")
}

// ==================== 2FA CODE ====================
export function twoFactorEmail(data: {
  userName: string
  code: string
  expiresIn: string
}): string {
  const content = `
    <h1>Код подтверждения входа 🔑</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Кто-то пытается войти в ваш аккаунт CloudHost. Если это вы, используйте код ниже для подтверждения входа.</p>
    
    <div class="code-block" style="text-align:center;font-size:40px;letter-spacing:12px;color:#3b82f6;background:#f0f9ff;">
      ${data.code}
    </div>
    
    <div class="warning-box">
      <p>⏰ Код действителен в течение <strong>${data.expiresIn}</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Если вы не пытались войти, немедленно смените пароль!</p>
  `

  return baseTemplate(content, "Код подтверждения для входа в CloudHost")
}

// ==================== SERVER CREATED ====================
export function serverCreatedEmail(data: {
  userName: string
  serverName: string
  serverIp: string
  plan: string
  location: string
  os: string
  rootPassword?: string
  panelUrl: string
}): string {
  const content = `
    <h1>Сервер создан! 🚀</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Отличные новости! Ваш новый сервер успешно создан и готов к использованию.</p>
    
    <div class="success-box">
      <p>✅ Сервер <strong>${data.serverName}</strong> активен и работает!</p>
    </div>
    
    <table class="data-table">
      <tr>
        <td class="label">Название:</td>
        <td class="value">${data.serverName}</td>
      </tr>
      <tr>
        <td class="label">IP адрес:</td>
        <td class="value" style="font-family:monospace;">${data.serverIp}</td>
      </tr>
      <tr>
        <td class="label">Тариф:</td>
        <td class="value">${data.plan}</td>
      </tr>
      <tr>
        <td class="label">Локация:</td>
        <td class="value">${data.location}</td>
      </tr>
      <tr>
        <td class="label">ОС:</td>
        <td class="value">${data.os}</td>
      </tr>
    </table>
    
    ${data.rootPassword ? `
    <div class="info-box">
      <p><strong>Root пароль:</strong> <code style="background:#e0e7ff;padding:2px 8px;border-radius:4px;font-family:monospace;">${data.rootPassword}</code></p>
      <p style="margin-top:8px;font-size:12px;">⚠️ Сохраните пароль в надёжном месте и смените его после первого входа!</p>
    </div>
    ` : ''}
    
    <div class="button-container">
      <a href="${data.panelUrl}" class="button">Управление сервером</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Подключение по SSH: <code style="background:#f4f4f5;padding:2px 8px;border-radius:4px;">ssh root@${data.serverIp}</code></p>
  `

  return baseTemplate(content, `Сервер ${data.serverName} успешно создан!`)
}

// ==================== SERVER EXPIRING ====================
export function serverExpiringEmail(data: {
  userName: string
  serverName: string
  serverIp: string
  expiresAt: string
  daysLeft: number
  renewUrl: string
  renewalCost: string
}): string {
  const isUrgent = data.daysLeft <= 1

  const content = `
    <h1>Срок действия сервера истекает ${isUrgent ? '⚠️' : '📅'}</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    ${isUrgent ? `
    <div class="warning-box">
      <p>🚨 <strong>Срочно!</strong> Ваш сервер будет приостановлен ${data.daysLeft === 0 ? 'сегодня' : 'завтра'}!</p>
    </div>
    ` : `
    <p>Напоминаем, что срок действия вашего сервера скоро истекает.</p>
    `}
    
    <table class="data-table">
      <tr>
        <td class="label">Сервер:</td>
        <td class="value">${data.serverName}</td>
      </tr>
      <tr>
        <td class="label">IP адрес:</td>
        <td class="value" style="font-family:monospace;">${data.serverIp}</td>
      </tr>
      <tr>
        <td class="label">Истекает:</td>
        <td class="value" style="color:${isUrgent ? '#dc2626' : '#f59e0b'};">${data.expiresAt}</td>
      </tr>
      <tr>
        <td class="label">Осталось дней:</td>
        <td class="value" style="color:${isUrgent ? '#dc2626' : '#f59e0b'};">${data.daysLeft}</td>
      </tr>
      <tr>
        <td class="label">Стоимость продления:</td>
        <td class="value">${data.renewalCost}</td>
      </tr>
    </table>
    
    <div class="button-container">
      <a href="${data.renewUrl}" class="button">${isUrgent ? '🔴 Продлить срочно' : 'Продлить сервер'}</a>
    </div>
    
    <div class="info-box">
      <p>💡 Включите автопродление, чтобы не беспокоиться о сроках!</p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">После истечения срока сервер будет приостановлен на 3 дня, затем данные будут удалены.</p>
  `

  return baseTemplate(
    content, 
    isUrgent 
      ? `⚠️ СРОЧНО: Сервер ${data.serverName} истекает ${data.daysLeft === 0 ? 'сегодня' : 'завтра'}!`
      : `Сервер ${data.serverName} истекает через ${data.daysLeft} дней`
  )
}

// ==================== PAYMENT CONFIRMATION ====================
export function paymentConfirmationEmail(data: {
  userName: string
  transactionId: string
  amount: string
  method: string
  date: string
  newBalance: string
  historyUrl: string
}): string {
  const content = `
    <h1>Платёж получен! 💰</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Ваш платёж успешно обработан. Средства зачислены на ваш баланс.</p>
    
    <div class="success-box">
      <p>✅ Зачислено: <strong style="font-size:18px;">${data.amount}</strong></p>
    </div>
    
    <table class="data-table">
      <tr>
        <td class="label">ID транзакции:</td>
        <td class="value" style="font-family:monospace;">${data.transactionId}</td>
      </tr>
      <tr>
        <td class="label">Способ оплаты:</td>
        <td class="value">${data.method}</td>
      </tr>
      <tr>
        <td class="label">Дата:</td>
        <td class="value">${data.date}</td>
      </tr>
      <tr>
        <td class="label">Новый баланс:</td>
        <td class="value" style="color:#10b981;font-weight:600;">${data.newBalance}</td>
      </tr>
    </table>
    
    <div class="button-container">
      <a href="${data.historyUrl}" class="button">История платежей</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Спасибо за использование CloudHost! 💙</p>
  `

  return baseTemplate(content, `Платёж ${data.amount} успешно зачислен!`)
}

// ==================== TICKET REPLY ====================
export function ticketReplyEmail(data: {
  userName: string
  ticketId: string
  ticketSubject: string
  replyPreview: string
  replierName: string
  ticketUrl: string
}): string {
  const content = `
    <h1>Новый ответ на тикет 📬</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Получен ответ на ваш тикет от службы поддержки.</p>
    
    <table class="data-table">
      <tr>
        <td class="label">Тикет #:</td>
        <td class="value">${data.ticketId}</td>
      </tr>
      <tr>
        <td class="label">Тема:</td>
        <td class="value">${data.ticketSubject}</td>
      </tr>
      <tr>
        <td class="label">Ответил:</td>
        <td class="value">${data.replierName}</td>
      </tr>
    </table>
    
    <div style="background:#f4f4f5;padding:16px 20px;border-radius:8px;margin:20px 0;border-left:3px solid #3b82f6;">
      <p style="margin:0;color:#52525b;font-style:italic;">"${data.replyPreview}..."</p>
    </div>
    
    <div class="button-container">
      <a href="${data.ticketUrl}" class="button">Читать полностью</a>
    </div>
  `

  return baseTemplate(content, `Новый ответ на тикет #${data.ticketId}`)
}

// ==================== NEWSLETTER ====================
export function newsletterEmail(data: {
  userName: string
  subject: string
  content: string
  ctaText?: string
  ctaUrl?: string
}): string {
  const emailContent = `
    <h1>${data.subject}</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    ${data.content}
    
    ${data.ctaText && data.ctaUrl ? `
    <div class="button-container">
      <a href="${data.ctaUrl}" class="button">${data.ctaText}</a>
    </div>
    ` : ''}
    
    <div class="divider"></div>
    
    <p style="font-size:14px;color:#71717a;">Вы получили это письмо, потому что подписаны на рассылку CloudHost.</p>
  `

  return baseTemplate(emailContent, data.subject)
}

// ==================== SECURITY ALERT ====================
export function securityAlertEmail(data: {
  userName: string
  alertType: "new_login" | "password_changed" | "2fa_enabled" | "2fa_disabled" | "suspicious_activity"
  details: {
    ipAddress?: string
    location?: string
    device?: string
    time: string
  }
  actionUrl: string
}): string {
  const alertMessages = {
    new_login: {
      title: "Новый вход в аккаунт",
      icon: "🔐",
      color: "#3b82f6",
    },
    password_changed: {
      title: "Пароль изменён",
      icon: "🔑",
      color: "#10b981",
    },
    "2fa_enabled": {
      title: "2FA включена",
      icon: "🛡️",
      color: "#10b981",
    },
    "2fa_disabled": {
      title: "2FA отключена",
      icon: "⚠️",
      color: "#f59e0b",
    },
    suspicious_activity: {
      title: "Подозрительная активность",
      icon: "🚨",
      color: "#dc2626",
    },
  }

  const alert = alertMessages[data.alertType]

  const content = `
    <h1>${alert.icon} ${alert.title}</h1>
    
    <p>Привет, <strong>${data.userName}</strong>!</p>
    
    <p>Зафиксирована активность в вашем аккаунте:</p>
    
    <div style="background:#f4f4f5;border-left:4px solid ${alert.color};padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
      <p style="margin:0;color:#18181b;font-weight:500;">${alert.title}</p>
    </div>
    
    <table class="data-table">
      <tr>
        <td class="label">Время:</td>
        <td class="value">${data.details.time}</td>
      </tr>
      ${data.details.ipAddress ? `
      <tr>
        <td class="label">IP адрес:</td>
        <td class="value" style="font-family:monospace;">${data.details.ipAddress}</td>
      </tr>
      ` : ''}
      ${data.details.location ? `
      <tr>
        <td class="label">Локация:</td>
        <td class="value">${data.details.location}</td>
      </tr>
      ` : ''}
      ${data.details.device ? `
      <tr>
        <td class="label">Устройство:</td>
        <td class="value">${data.details.device}</td>
      </tr>
      ` : ''}
    </table>
    
    ${data.alertType === "suspicious_activity" || data.alertType === "2fa_disabled" ? `
    <div class="warning-box">
      <p>⚠️ Если это были не вы, немедленно смените пароль и свяжитесь с поддержкой!</p>
    </div>
    ` : ''}
    
    <div class="button-container">
      <a href="${data.actionUrl}" class="button">Проверить активность</a>
    </div>
  `

  return baseTemplate(content, `${alert.icon} ${alert.title} - CloudHost`)
}
