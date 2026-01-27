# 🚀 Руководство по развертыванию

Подробные инструкции по развертыванию сайта на различных платформах.

## 📋 Предварительные требования

- Node.js 18+ 
- npm, yarn или pnpm
- Git
- Аккаунт на выбранной платформе

## 🏗️ Локальная сборка

### 1. Установка зависимостей
```bash
npm install
# или
yarn install
# или
pnpm install
```

### 2. Сборка проекта
```bash
npm run build
# или
yarn build
# или
pnpm build
```

### 3. Тестирование сборки
```bash
npm start
# или
yarn start
# или
pnpm start
```

## 🌐 GitHub Pages

### 1. Подготовка репозитория
```bash
# Инициализация Git
git init
git add .
git commit -m "Initial commit"

# Добавление удаленного репозитория
git remote add origin https://github.com/username/repository-name.git
git branch -M main
git push -u origin main
```

### 2. Настройка GitHub Pages
1. Перейдите в Settings → Pages
2. Source: Deploy from a branch
3. Branch: main
4. Folder: / (root)
5. Save

### 3. Автоматическое развертывание
Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## ☁️ Vercel

### 1. Подключение репозитория
1. Перейдите на [vercel.com](https://vercel.com)
2. Import Git Repository
3. Выберите ваш репозиторий
4. Настройте параметры

### 2. Автоматическое развертывание
Vercel автоматически:
- Определяет Next.js проект
- Устанавливает зависимости
- Собирает проект
- Развертывает на CDN

### 3. Домены
- Автоматический домен: `project-name.vercel.app`
- Кастомный домен: настройте в Dashboard

## 🐟 Netlify

### 1. Подключение репозитория
1. Перейдите на [netlify.com](https://netlify.com)
2. New site from Git
3. Выберите GitHub
4. Выберите репозиторий

### 2. Настройка сборки
```
Build command: npm run build
Publish directory: out
```

### 3. Переменные окружения
Добавьте в Netlify Dashboard:
```
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

## 🐳 Docker

### 1. Dockerfile
Создайте `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Сборка и запуск
```bash
# Сборка образа
docker build -t host-site .

# Запуск контейнера
docker run -p 3000:3000 host-site
```

## 🔧 Переменные окружения

Создайте `.env.local`:

```env
# Базовая конфигурация
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=Host

# Аналитика (опционально)
NEXT_PUBLIC_GA_ID=your-ga-id
NEXT_PUBLIC_GTM_ID=your-gtm-id

# API ключи (если нужны)
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## 📱 PWA настройка

### 1. next.config.mjs
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // ваши настройки
})
```

### 2. manifest.json
Создайте `public/manifest.json`:

```json
{
  "name": "Host - Игровой хостинг",
  "short_name": "Host",
  "description": "Надежный игровой хостинг с панелью управления Pterodactyl",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🚀 Оптимизация производительности

### 1. Изображения
- Используйте Next.js Image компонент
- Оптимизируйте размеры
- Используйте WebP формат

### 2. Бандл анализ
```bash
npm install --save-dev @next/bundle-analyzer
```

### 3. Ленивая загрузка
```javascript
import dynamic from 'next/dynamic'

const LazyComponent = dynamic(() => import('./Component'), {
  loading: () => <p>Загрузка...</p>
})
```

## 📊 Мониторинг

### 1. Vercel Analytics
```bash
npm install @vercel/analytics
```

### 2. Google Analytics
```javascript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="your-ga-id" />
      </body>
    </html>
  )
}
```

## 🔗 Полезные ссылки

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Docker Documentation](https://docs.docker.com/)

## 📞 Поддержка

- **Разработчик:** @prd_yt
- **Telegram:** [@worksprd](https://t.me/worksprd)
- **Второй канал:** [@prdbotsell](https://t.me/prdbotsell)
- **Бесплатные работы:** [@freecodeprd](https://t.me/freecodeprd)
- **Отзывы:** [@prdrevies](https://t.me/prdrevies)

## 🌟 Лучший хостинг

Не забудьте про лучший хостинг: [Svortex.ru](https://svortex.ru)

---

**Успешного развертывания!** 🚀
