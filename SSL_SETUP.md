# 🔒 Настройка SSL сертификата (HTTPS)

Подробное руководство по настройке SSL сертификата для вашего хостинг-сайта.

## 🌟 Автоматический SSL (Рекомендуется)

### Vercel
✅ **SSL включен автоматически**
- Vercel автоматически выдает SSL сертификаты для всех доменов
- Поддерживает как поддомены Vercel (.vercel.app), так и кастомные домены
- Автоматическое обновление сертификатов

### Netlify
✅ **SSL включен автоматически**
- Автоматические SSL сертификаты от Let's Encrypt
- Поддержка кастомных доменов
- Автоматическое обновление

### Cloudflare Pages
✅ **SSL включен автоматически**
- Бесплатные SSL сертификаты
- Дополнительная защита от DDoS
- CDN для ускорения сайта

## 🏠 Собственный сервер

### 1. Использование Certbot (Let's Encrypt)

#### Ubuntu/Debian:
\`\`\`bash
# Установка Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

#### CentOS/RHEL:
\`\`\`bash
# Установка Certbot
sudo yum install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

### 2. Настройка Nginx

Создайте конфигурацию Nginx:

```nginx
# /etc/nginx/sites-available/yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Проксирование к Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
