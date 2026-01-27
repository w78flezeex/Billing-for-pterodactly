<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS"/>
</p>

<h1 align="center">🚀 HostingPanel</h1>

<p align="center">
  <b>Современная панель управления хостингом с интеграцией Pterodactyl</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Версия-1.0.0-green?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/Лицензия-MIT-yellow?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square" alt="Made with love"/>
</p>

---

## 👨‍💻 Разработчик

<p align="center">
  <img src="https://img.shields.io/badge/Разработчик-@prd__yt-purple?style=for-the-badge&logo=telegram" alt="Developer"/>
</p>

| Ресурс | Ссылка |
|--------|--------|
| 📢 **Основной канал** | [@worksprd](https://t.me/worksprd) |
| 🛒 **Магазин ботов** | [@prdbotsell](https://t.me/prdbotsell) |
| 🆓 **Бесплатные работы** | [@freecodeprd](https://t.me/freecodeprd) |
| ⭐ **Отзывы** | [@prdrevies](https://t.me/prdrevies) |

---

## ✨ Возможности

<table>
<tr>
<td width="50%">

### 🎮 Для пользователей
- 🖥️ Управление игровыми серверами
- 💳 Пополнение баланса (YooKassa)
- 📊 История транзакций и счетов
- 🎫 Система тикетов поддержки
- 🔐 Двухфакторная аутентификация (2FA)
- 👥 Реферальная программа
- 🌙 Тёмная / светлая тема
- 📱 Адаптивный дизайн

</td>
<td width="50%">

### 👨‍💼 Для администраторов
- 📈 Аналитика и статистика
- 👤 Управление пользователями
- 💰 Управление платежами
- 🎁 Промокоды и скидки
- 📋 База знаний (FAQ)
- 🗺️ Управление локациями
- ⚙️ Гибкие настройки
- 📝 Логирование действий

</td>
</tr>
</table>

---

## 🛠️ Технологии

| Категория | Технологии |
|-----------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, Prisma ORM |
| **База данных** | PostgreSQL |
| **Аутентификация** | JWT, bcrypt, TOTP (2FA) |
| **Платежи** | YooKassa (ЮKassa) |
| **Панель серверов** | Pterodactyl Panel API |
| **Безопасность** | Rate Limiting, CSP, XSS/SQL Injection Protection |

---

## 📋 Требования

Перед установкой убедитесь, что у вас установлены:

| Программа | Версия | Описание |
|-----------|--------|----------|
| **Node.js** | `>= 18.17.0` | JavaScript runtime |
| **PostgreSQL** | `>= 14.0` | База данных |
| **npm** / **pnpm** | Любая | Менеджер пакетов |
| **Git** | Любая | Система контроля версий |

---

## 🚀 Быстрый старт

### 1️⃣ Клонирование репозитория

```bash
git clone https://github.com/prd-yt/hosting-panel.git
cd hosting-panel
```

### 2️⃣ Установка зависимостей

```bash
# Используя npm
npm install

# Или используя pnpm (рекомендуется)
pnpm install
```

### 3️⃣ Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# ==================== DATABASE ====================
DATABASE_URL="postgresql://user:password@localhost:5432/hosting_billing"

# ==================== AUTH ====================
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# ==================== APP ====================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="HostingPanel"

# ==================== YOOKASSA (Платежи) ====================
YOOKASSA_SHOP_ID="your-shop-id"
YOOKASSA_SECRET_KEY="your-secret-key"

# ==================== PTERODACTYL (Опционально) ====================
PTERODACTYL_URL="https://panel.example.com"
PTERODACTYL_API_KEY="your-api-key"

# ==================== EMAIL (Опционально) ====================
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"
```

### 4️⃣ Инициализация базы данных

```bash
# Применение миграций
npx prisma migrate deploy

# Или создание БД с нуля (режим разработки)
npx prisma db push

# Генерация Prisma Client
npx prisma generate
```

### 5️⃣ Создание администратора

```bash
# Запустите seed для создания админа
npx prisma db seed
```

> **📌 Данные по умолчанию:**
> - 📧 Email: `admin@example.com`
> - 🔑 Пароль: `admin123`
> 
> ⚠️ **Обязательно смените пароль после первого входа!**

### 6️⃣ Запуск проекта

```bash
# Режим разработки
npm run dev

# Production сборка
npm run build
npm start
```

🎉 **Готово!** Откройте http://localhost:3000

---

## 📁 Структура проекта

```
hosting-panel/
├── 📂 app/                    # Next.js App Router
│   ├── 📂 (auth)/            # Страницы авторизации
│   ├── 📂 (dashboard)/       # Личный кабинет
│   ├── 📂 admin/             # Админ-панель
│   │   ├── 📂 users/        # Управление пользователями
│   │   ├── 📂 payments/     # Управление платежами
│   │   ├── 📂 knowledge/    # База знаний
│   │   └── 📂 settings/     # Настройки
│   ├── 📂 billing/           # Платежи
│   └── 📂 api/               # API маршруты
│       ├── 📂 auth/         # Авторизация
│       ├── 📂 admin/        # Админ API
│       ├── 📂 billing/      # Платежи API
│       └── 📂 servers/      # Серверы API
├── 📂 components/            # React компоненты
│   └── 📂 ui/               # shadcn/ui компоненты
├── 📂 lib/                   # Утилиты и хелперы
│   ├── 📄 auth.ts           # Аутентификация
│   ├── 📄 db.ts             # Prisma клиент
│   ├── 📄 security.ts       # Защита от атак
│   ├── 📄 billing.ts        # Биллинг логика
│   └── 📂 payments/         # Платёжные провайдеры
├── 📂 prisma/               # Схема БД
│   └── 📄 schema.prisma
├── 📂 public/               # Статические файлы
├── 📄 middleware.ts         # Security middleware
└── 📄 tailwind.config.ts    # Конфиг Tailwind
```

---

## 🔒 Безопасность

Проект защищён от основных видов атак:

| Защита | Описание | Статус |
|--------|----------|--------|
| 🛡️ **Rate Limiting** | Ограничение запросов (auth: 10/15мин, API: 100/мин) | ✅ |
| 🔐 **XSS Protection** | Санитизация ввода, CSP headers | ✅ |
| 💉 **SQL Injection** | Prisma ORM + валидация параметров | ✅ |
| 🖼️ **Clickjacking** | X-Frame-Options: DENY | ✅ |
| 🔑 **CSRF** | SameSite cookies, token validation | ✅ |
| 📝 **Security Headers** | HSTS, CSP, X-Content-Type-Options | ✅ |
| 🤖 **Bot Protection** | Блокировка сканеров уязвимостей | ✅ |
| 🔒 **2FA** | Двухфакторная аутентификация TOTP | ✅ |

---

## ⚙️ Конфигурация

### 💳 Настройка YooKassa

1. Зарегистрируйтесь в [YooKassa](https://yookassa.ru)
2. Получите `Shop ID` и `Secret Key` в личном кабинете
3. Настройте webhook URL:
   ```
   https://your-domain.com/api/billing/webhook/yookassa
   ```
4. Укажите данные в `.env`

### 🦖 Настройка Pterodactyl

1. В панели Pterodactyl перейдите в **Settings → API**
2. Создайте новый API ключ с правами:
   - `Servers: Read & Write`
   - `Nests: Read`
   - `Locations: Read`
3. Укажите URL и ключ в `.env`

---

## 📝 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Сборка для production |
| `npm start` | Запуск production |
| `npm run lint` | Проверка ESLint |
| `npx tsc --noEmit` | Проверка TypeScript |
| `npx prisma studio` | Визуальный редактор БД |
| `npx prisma migrate` | Применить миграции |
| `npx prisma generate` | Сгенерировать клиент |

---

## 🐳 Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/hosting
    depends_on:
      - db
      
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=hosting
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Запуск
docker-compose up -d
```

---

## 📸 Скриншоты

<details>
<summary>🖼️ Показать скриншоты</summary>

### Главная страница
![Home](https://via.placeholder.com/800x400?text=Home+Page)

### Личный кабинет
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

### Админ-панель
![Admin](https://via.placeholder.com/800x400?text=Admin+Panel)

</details>

---

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

| Способ | Ссылка |
|--------|--------|
| 💬 **Telegram** | [@prd_yt](https://t.me/prd_yt) |
| 📢 **Канал** | [@worksprd](https://t.me/worksprd) |
| 🐛 **Issues** | [GitHub Issues](https://github.com/prd-yt/hosting-panel/issues) |

---

## 📄 Лицензия

Этот проект распространяется под лицензией **MIT**.

```
MIT License

Copyright (c) 2025-2026 @prd_yt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ⭐ Поставь звезду!

Если проект был полезен, поставь ⭐ на GitHub — это мотивирует разработчика!

---

<p align="center">
  <br>
  <img src="https://img.shields.io/badge/Разработчик-@prd__yt-purple?style=for-the-badge&logo=telegram" alt="Developer"/>
  <br><br>
  <b>🔥 Сделано с ❤️ для вас 🔥</b>
  <br><br>
  <sub>© 2025-2026 HostingPanel by @prd_yt. Все права защищены.</sub>
</p>

---

<p align="center">
  <a href="#-hostingpanel">⬆️ Наверх</a>
</p>
