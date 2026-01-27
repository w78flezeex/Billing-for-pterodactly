/**
 * Система email уведомлений
 * Поддержка SMTP и шаблонов
 */

import nodemailer from 'nodemailer'

interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

interface SendEmailParams {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
  attachments?: EmailAttachment[]
}

// Создаем транспорт для отправки
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Базовый HTML шаблон
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .logo {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .content {
      padding: 32px 24px;
    }
    .content h2 {
      margin: 0 0 16px;
      color: #1f2937;
    }
    .content p {
      margin: 0 0 16px;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white !important;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .info-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .info-box.warning {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .info-box.success {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .info-box.error {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .details-table td {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-table td:first-child {
      color: #6b7280;
      width: 40%;
    }
    .details-table td:last-child {
      font-weight: 500;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <div class="logo">🖥️</div>
        <h1>Hosting Service</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Это автоматическое уведомление от Hosting Service</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}">Личный кабинет</a> • 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">Поддержка</a>
        </p>
        <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">
          Если вы не регистрировались на нашем сервисе, проигнорируйте это письмо.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

// Шаблоны писем
const templates: Record<string, (data: Record<string, unknown>) => string> = {
  // Приветственное письмо
  'welcome': (data) => `
    <h2>Добро пожаловать, ${data.userName}! 🎉</h2>
    <p>Спасибо за регистрацию в Hosting Service. Мы рады видеть вас в числе наших клиентов!</p>
    <p>Теперь вы можете:</p>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li>Создавать и управлять серверами</li>
      <li>Пополнять баланс удобным способом</li>
      <li>Получать техническую поддержку 24/7</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">Перейти в личный кабинет</a>
  `,

  // Подтверждение email
  'verify-email': (data) => `
    <h2>Подтвердите email адрес</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Для подтверждения вашего email адреса перейдите по ссылке ниже:</p>
    <a href="${data.verifyUrl}" class="button">Подтвердить email</a>
    <p style="font-size: 13px; color: #6b7280;">
      Ссылка действительна 24 часа. Если вы не регистрировались, проигнорируйте это письмо.
    </p>
  `,

  // Сброс пароля
  'reset-password': (data) => `
    <h2>Сброс пароля</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы создать новый пароль:</p>
    <a href="${data.resetUrl}" class="button">Сбросить пароль</a>
    <div class="info-box warning">
      <strong>⚠️ Важно:</strong> Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
    </div>
  `,

  // Успешное пополнение баланса
  'balance-topup': (data) => `
    <h2>Баланс пополнен! ✅</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Ваш баланс успешно пополнен.</p>
    <table class="details-table">
      <tr>
        <td>Сумма:</td>
        <td>+${Number(data.amount).toLocaleString('ru-RU')} ₽</td>
      </tr>
      <tr>
        <td>Способ оплаты:</td>
        <td>${data.paymentMethod}</td>
      </tr>
      <tr>
        <td>Новый баланс:</td>
        <td>${Number(data.newBalance).toLocaleString('ru-RU')} ₽</td>
      </tr>
      <tr>
        <td>Дата:</td>
        <td>${data.date}</td>
      </tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">Перейти в профиль</a>
  `,

  // Сервер успешно продлён
  'server-renewed': (data) => `
    <h2>Сервер продлён ✅</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Ваш сервер успешно продлён на 30 дней.</p>
    <table class="details-table">
      <tr>
        <td>Сервер:</td>
        <td>${data.serverName}</td>
      </tr>
      <tr>
        <td>Тариф:</td>
        <td>${data.planName}</td>
      </tr>
      <tr>
        <td>Списано:</td>
        <td>${Number(data.amount).toLocaleString('ru-RU')} ₽</td>
      </tr>
      <tr>
        <td>Действует до:</td>
        <td>${data.newExpiresAt}</td>
      </tr>
    </table>
    <div class="info-box success">
      ✅ Автопродление активно. Убедитесь, что на балансе достаточно средств к следующей дате продления.
    </div>
  `,

  // Сервер скоро истечёт
  'server-expiring': (data) => `
    <h2>⏰ Сервер истекает через ${data.daysLeft} ${Number(data.daysLeft) === 1 ? 'день' : 'дня'}</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Срок действия вашего сервера скоро закончится.</p>
    <table class="details-table">
      <tr>
        <td>Сервер:</td>
        <td>${data.serverName}</td>
      </tr>
      <tr>
        <td>Тариф:</td>
        <td>${data.planName}</td>
      </tr>
      <tr>
        <td>Истекает:</td>
        <td>${data.expiresAt}</td>
      </tr>
      <tr>
        <td>Автопродление:</td>
        <td>${data.autoRenew ? '✅ Включено' : '❌ Выключено'}</td>
      </tr>
    </table>
    ${data.autoRenew ? (
      data.canAutoRenew 
        ? `<div class="info-box success">
            ✅ На балансе достаточно средств (${Number(data.currentBalance).toLocaleString('ru-RU')} ₽). 
            Сервер будет автоматически продлён.
          </div>`
        : `<div class="info-box error">
            ⚠️ Недостаточно средств для автопродления!<br>
            Требуется: ${Number(data.requiredAmount).toLocaleString('ru-RU')} ₽<br>
            На балансе: ${Number(data.currentBalance).toLocaleString('ru-RU')} ₽
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/topup" class="button">Пополнить баланс</a>`
    ) : `
      <div class="info-box warning">
        Автопродление отключено. После истечения срока сервер будет приостановлен.
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/servers" class="button">Управление серверами</a>
    `}
  `,

  // Сервер приостановлен
  'server-suspended': (data) => `
    <h2>🔴 Сервер приостановлен</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Ваш сервер был приостановлен из-за истечения срока оплаты.</p>
    <table class="details-table">
      <tr>
        <td>Сервер:</td>
        <td>${data.serverName}</td>
      </tr>
      <tr>
        <td>Причина:</td>
        <td>${data.reason}</td>
      </tr>
      ${data.requiredAmount ? `
        <tr>
          <td>Требуется для продления:</td>
          <td>${Number(data.requiredAmount).toLocaleString('ru-RU')} ₽</td>
        </tr>
      ` : ''}
      <tr>
        <td>Ваш баланс:</td>
        <td>${Number(data.currentBalance).toLocaleString('ru-RU')} ₽</td>
      </tr>
    </table>
    <div class="info-box error">
      ⚠️ <strong>Важно:</strong> Сервер будет удалён через 7 дней, если не будет продлён.
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/topup" class="button">Пополнить баланс</a>
  `,

  // Инвойс создан
  'invoice': (data) => `
    <h2>📄 Новый счёт ${data.invoiceNumber}</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Для вас создан новый счёт на оплату.</p>
    <table class="details-table">
      <tr>
        <td>Номер счёта:</td>
        <td>${data.invoiceNumber}</td>
      </tr>
      <tr>
        <td>Сумма:</td>
        <td>${Number(data.amount).toLocaleString('ru-RU')} ₽</td>
      </tr>
      <tr>
        <td>Срок оплаты:</td>
        <td>${data.dueDate}</td>
      </tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/invoices/${data.invoiceNumber}" class="button">Посмотреть счёт</a>
    <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">
      Счёт также прикреплён к этому письму.
    </p>
  `,

  // Ответ в тикете
  'ticket-reply': (data) => `
    <h2>💬 Новый ответ в тикете</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>В вашем тикете появился новый ответ от службы поддержки.</p>
    <table class="details-table">
      <tr>
        <td>Тикет:</td>
        <td>#${data.ticketId}</td>
      </tr>
      <tr>
        <td>Тема:</td>
        <td>${data.subject}</td>
      </tr>
    </table>
    <div class="info-box">
      <strong>${data.replyFrom}:</strong><br>
      ${data.replyPreview}...
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${data.ticketId}" class="button">Открыть тикет</a>
  `,

  // Тикет закрыт
  'ticket-closed': (data) => `
    <h2>✅ Тикет закрыт</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Ваш тикет был закрыт.</p>
    <table class="details-table">
      <tr>
        <td>Тикет:</td>
        <td>#${data.ticketId}</td>
      </tr>
      <tr>
        <td>Тема:</td>
        <td>${data.subject}</td>
      </tr>
    </table>
    <p>Если у вас остались вопросы, вы можете создать новый тикет.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets" class="button">Мои тикеты</a>
  `,

  // Уведомление о входе
  'login-notification': (data) => `
    <h2>🔐 Новый вход в аккаунт</h2>
    <p>Здравствуйте, ${data.userName}!</p>
    <p>Зафиксирован вход в ваш аккаунт.</p>
    <table class="details-table">
      <tr>
        <td>Дата и время:</td>
        <td>${data.loginTime}</td>
      </tr>
      <tr>
        <td>IP адрес:</td>
        <td>${data.ipAddress}</td>
      </tr>
      <tr>
        <td>Устройство:</td>
        <td>${data.userAgent}</td>
      </tr>
      ${data.location ? `
        <tr>
          <td>Местоположение:</td>
          <td>${data.location}</td>
        </tr>
      ` : ''}
    </table>
    <div class="info-box warning">
      Если это были не вы, немедленно <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/security">смените пароль</a> 
      и включите двухфакторную аутентификацию.
    </div>
  `,
}

/**
 * Отправить email
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, template, data, attachments } = params
  
  // Проверяем конфигурацию
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured, skipping email:', subject)
    return false
  }
  
  // Получаем шаблон
  const templateFn = templates[template]
  if (!templateFn) {
    console.error(`Email template "${template}" not found`)
    return false
  }
  
  try {
    const content = templateFn(data)
    const html = getBaseTemplate(content)
    
    await transporter.sendMail({
      from: `"Hosting Service" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })
    
    console.log(`Email sent: ${subject} -> ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

/**
 * Отправить тестовое письмо
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Тестовое письмо от Hosting Service',
    template: 'welcome',
    data: {
      userName: 'Тестовый пользователь',
    },
  })
}
