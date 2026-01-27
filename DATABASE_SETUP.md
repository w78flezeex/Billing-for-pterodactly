# Настройка базы данных PostgreSQL и биллинга

## Требования

- PostgreSQL 14+ установлен и запущен
- Node.js 18+
- npm или pnpm

## Быстрый старт

### 1. Установка PostgreSQL

#### Windows
Скачай и установи с https://www.postgresql.org/download/windows/

#### Docker (рекомендуется)
```bash
docker run --name postgres-hosting -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hosting_billing -p 5432:5432 -d postgres:16
```

### 2. Настройка переменных окружения

Скопируй `.env.example` в `.env` и отредактируй:

```bash
cp .env.example .env
```

Измени `DATABASE_URL` на свои данные:
```
DATABASE_URL="postgresql://postgres:твой_пароль@localhost:5432/hosting_billing"
```

**Важно:** Сгенерируй безопасный `JWT_SECRET` для продакшена!

### 3. Создание базы данных

Если используешь PostgreSQL напрямую:
```sql
CREATE DATABASE hosting_billing;
```

### 4. Применение миграций

```bash
npx prisma migrate dev --name init
```

Это создаст все таблицы в базе данных.

### 5. Запуск проекта

```bash
npm run dev
```

## Структура базы данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи системы |
| `sessions` | Активные сессии |
| `plans` | Тарифные планы |
| `servers` | Серверы пользователей |
| `orders` | Заказы |
| `invoices` | Счета |
| `tickets` | Тикеты поддержки |
| `ticket_messages` | Сообщения в тикетах |

### Роли пользователей

- `USER` - обычный пользователь
- `ADMIN` - администратор
- `MODERATOR` - модератор

## API Endpoints

### Авторизация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |

### Профиль

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/user/profile` | Получить профиль с серверами и заказами |
| PATCH | `/api/user/profile` | Обновить профиль или сменить пароль |

## Страницы

- `/login` - Страница входа
- `/register` - Страница регистрации
- `/profile` - Личный кабинет

## Prisma команды

```bash
# Сгенерировать клиент
npx prisma generate

# Применить миграции
npx prisma migrate dev

# Открыть Prisma Studio (GUI для БД)
npx prisma studio

# Сбросить БД
npx prisma migrate reset
```

## Безопасность

- Пароли хешируются с помощью bcrypt (12 раундов)
- JWT токены для аутентификации
- HTTP-only cookies для хранения токенов
- Валидация данных через Zod
