export const siteConfig = {
  // Основные настройки сайта
  siteName: "Host",
  siteDescription: {
    ru: "Надежный игровой хостинг с панелью управления Pterodactyl. Мощные серверы для ваших проектов.",
    en: "Reliable game hosting with Pterodactyl control panel. Powerful servers for your projects.",
    ua: "Надійний ігровий хостинг з панеллю управління Pterodactyl. Потужні сервери для ваших проектів.",
  },

  // Контактная информация
  contacts: {
    email: "support@host.com",
    telegram: "@host_official",
    discord: "discord.gg/host-community",
  },

  // Социальные сети
  social: {
    discord: "https://discord.gg/host-community",
    telegram: "https://t.me/host_official",
  },

  // Статистика для hero секции
  stats: {
    uptime: "99.9%",
    support: "24/7",
    serverStart: "<5мин",
  },

  // Автор сайта
  developer: "@prd_yt",
}

// Тарифные планы
export const pricingPlans = {
  game: [
    {
      name: "Game Starter",
      description: {
        ru: "Для небольших серверов",
        en: "For small servers",
        ua: "Для невеликих серверів",
      },
      price: { monthly: 299, yearly: 2990 },
      features: {
        ru: ["2 GB RAM", "20 GB SSD", "1 CPU Core", "Панель Pterodactyl", "DDoS защита", "Поддержка 24/7"],
        en: ["2 GB RAM", "20 GB SSD", "1 CPU Core", "Pterodactyl Panel", "DDoS Protection", "24/7 Support"],
        ua: ["2 GB RAM", "20 GB SSD", "1 CPU Core", "Панель Pterodactyl", "DDoS захист", "Підтримка 24/7"],
      },
      popular: false,
    },
    {
      name: "Game Pro",
      description: {
        ru: "Для популярных серверов",
        en: "For popular servers",
        ua: "Для популярних серверів",
      },
      price: { monthly: 599, yearly: 5990 },
      features: {
        ru: [
          "4 GB RAM",
          "50 GB SSD",
          "2 CPU Cores",
          "Панель Pterodactyl",
          "DDoS защита",
          "Поддержка 24/7",
          "Автобэкапы",
          "Приоритетная поддержка",
        ],
        en: [
          "4 GB RAM",
          "50 GB SSD",
          "2 CPU Cores",
          "Pterodactyl Panel",
          "DDoS Protection",
          "24/7 Support",
          "Auto Backups",
          "Priority Support",
        ],
        ua: [
          "4 GB RAM",
          "50 GB SSD",
          "2 CPU Cores",
          "Панель Pterodactyl",
          "DDoS захист",
          "Підтримка 24/7",
          "Автобекапи",
          "Пріоритетна підтримка",
        ],
      },
      popular: true,
    },
    {
      name: "Game Ultimate",
      description: {
        ru: "Максимальная производительность",
        en: "Maximum performance",
        ua: "Максимальна продуктивність",
      },
      price: { monthly: 1199, yearly: 11990 },
      features: {
        ru: [
          "8 GB RAM",
          "100 GB SSD",
          "4 CPU Cores",
          "Панель Pterodactyl",
          "DDoS защита",
          "Поддержка 24/7",
          "Автобэкапы",
          "Приоритетная поддержка",
          "Выделенный IP",
          "Персональный менеджер",
        ],
        en: [
          "8 GB RAM",
          "100 GB SSD",
          "4 CPU Cores",
          "Pterodactyl Panel",
          "DDoS Protection",
          "24/7 Support",
          "Auto Backups",
          "Priority Support",
          "Dedicated IP",
          "Personal Manager",
        ],
        ua: [
          "8 GB RAM",
          "100 GB SSD",
          "4 CPU Cores",
          "Панель Pterodactyl",
          "DDoS захист",
          "Підтримка 24/7",
          "Автобекапи",
          "Пріоритетна підтримка",
          "Виділений IP",
          "Персональний менеджер",
        ],
      },
      popular: false,
    },
  ],
  vps: [
    {
      name: "VPS Start",
      description: {
        ru: "Базовый VPS",
        en: "Basic VPS",
        ua: "Базовий VPS",
      },
      price: { monthly: 599, yearly: 5990 },
      features: {
        ru: ["1 vCPU", "1 GB RAM", "25 GB SSD", "1 TB трафик", "Ubuntu/CentOS", "Root доступ"],
        en: ["1 vCPU", "1 GB RAM", "25 GB SSD", "1 TB traffic", "Ubuntu/CentOS", "Root access"],
        ua: ["1 vCPU", "1 GB RAM", "25 GB SSD", "1 TB трафік", "Ubuntu/CentOS", "Root доступ"],
      },
      popular: false,
    },
    {
      name: "VPS Business",
      description: {
        ru: "Для бизнеса",
        en: "For business",
        ua: "Для бізнесу",
      },
      price: { monthly: 1299, yearly: 12990 },
      features: {
        ru: ["2 vCPU", "4 GB RAM", "80 GB SSD", "3 TB трафик", "Любая ОС", "IPv4 + IPv6"],
        en: ["2 vCPU", "4 GB RAM", "80 GB SSD", "3 TB traffic", "Any OS", "IPv4 + IPv6"],
        ua: ["2 vCPU", "4 GB RAM", "80 GB SSD", "3 TB трафік", "Будь-яка ОС", "IPv4 + IPv6"],
      },
      popular: true,
    },
    {
      name: "VPS Pro",
      description: {
        ru: "Профессиональный",
        en: "Professional",
        ua: "Професійний",
      },
      price: { monthly: 2499, yearly: 24990 },
      features: {
        ru: ["4 vCPU", "8 GB RAM", "160 GB SSD", "5 TB трафик", "Snapshot", "Балансировщик"],
        en: ["4 vCPU", "8 GB RAM", "160 GB SSD", "5 TB traffic", "Snapshot", "Load Balancer"],
        ua: ["4 vCPU", "8 GB RAM", "160 GB SSD", "5 TB трафік", "Snapshot", "Балансувальник"],
      },
      popular: false,
    },
  ],
  web: [
    {
      name: "Web Starter",
      description: {
        ru: "Для одного сайта",
        en: "For one website",
        ua: "Для одного сайту",
      },
      price: { monthly: 199, yearly: 1990 },
      features: {
        ru: ["1 сайт", "5 GB SSD", "100 GB трафик", "1 MySQL", "SSL сертификат", "cPanel"],
        en: ["1 website", "5 GB SSD", "100 GB traffic", "1 MySQL", "SSL certificate", "cPanel"],
        ua: ["1 сайт", "5 GB SSD", "100 GB трафік", "1 MySQL", "SSL сертифікат", "cPanel"],
      },
      popular: false,
    },
    {
      name: "Web Business",
      description: {
        ru: "Для нескольких сайтов",
        en: "For multiple websites",
        ua: "Для декількох сайтів",
      },
      price: { monthly: 399, yearly: 3990 },
      features: {
        ru: ["5 сайтов", "25 GB SSD", "500 GB трафик", "10 MySQL", "Wildcard SSL", "WordPress"],
        en: ["5 websites", "25 GB SSD", "500 GB traffic", "10 MySQL", "Wildcard SSL", "WordPress"],
        ua: ["5 сайтів", "25 GB SSD", "500 GB трафік", "10 MySQL", "Wildcard SSL", "WordPress"],
      },
      popular: true,
    },
    {
      name: "Web Pro",
      description: {
        ru: "Профессиональный",
        en: "Professional",
        ua: "Професійний",
      },
      price: { monthly: 799, yearly: 7990 },
      features: {
        ru: ["Безлимит сайтов", "100 GB SSD", "Безлимит трафик", "Безлимит MySQL", "SSH доступ", "Git"],
        en: ["Unlimited websites", "100 GB SSD", "Unlimited traffic", "Unlimited MySQL", "SSH access", "Git"],
        ua: ["Безліміт сайтів", "100 GB SSD", "Безліміт трафік", "Безліміт MySQL", "SSH доступ", "Git"],
      },
      popular: false,
    },
  ],
  dedicated: [
    {
      name: "Dedicated Start",
      description: {
        ru: "Начальный уровень",
        en: "Entry level",
        ua: "Початковий рівень",
      },
      price: { monthly: 8999, yearly: 89990 },
      features: {
        ru: ["Intel Xeon E3", "16 GB DDR4", "1 TB HDD", "10 TB трафик", "100 Mbit/s", "IPMI"],
        en: ["Intel Xeon E3", "16 GB DDR4", "1 TB HDD", "10 TB traffic", "100 Mbit/s", "IPMI"],
        ua: ["Intel Xeon E3", "16 GB DDR4", "1 TB HDD", "10 TB трафік", "100 Mbit/s", "IPMI"],
      },
      popular: false,
    },
    {
      name: "Dedicated Pro",
      description: {
        ru: "Профессиональный",
        en: "Professional",
        ua: "Професійний",
      },
      price: { monthly: 15999, yearly: 159990 },
      features: {
        ru: ["Intel Xeon E5", "32 GB DDR4", "500 GB SSD", "20 TB трафик", "1 Gbit/s", "RAID"],
        en: ["Intel Xeon E5", "32 GB DDR4", "500 GB SSD", "20 TB traffic", "1 Gbit/s", "RAID"],
        ua: ["Intel Xeon E5", "32 GB DDR4", "500 GB SSD", "20 TB трафік", "1 Gbit/s", "RAID"],
      },
      popular: true,
    },
    {
      name: "Dedicated Max",
      description: {
        ru: "Максимальный",
        en: "Maximum",
        ua: "Максимальний",
      },
      price: { monthly: 29999, yearly: 299990 },
      features: {
        ru: ["Intel Xeon Gold", "128 GB DDR4", "2x1TB NVMe", "50 TB трафик", "10 Gbit/s", "Резерв"],
        en: ["Intel Xeon Gold", "128 GB DDR4", "2x1TB NVMe", "50 TB traffic", "10 Gbit/s", "Backup"],
        ua: ["Intel Xeon Gold", "128 GB DDR4", "2x1TB NVMe", "50 TB трафік", "10 Gbit/s", "Резерв"],
      },
      popular: false,
    },
  ],
}

// Отзывы клиентов
export const testimonials = [
  {
    name: {
      ru: "Алексей Петров",
      en: "Alex Petrov",
      ua: "Олексій Петров",
    },
    role: {
      ru: "Владелец Minecraft сервера",
      en: "Minecraft Server Owner",
      ua: "Власник Minecraft сервера",
    },
    content: {
      ru: "Отличный хостинг! Сервер работает стабильно, поддержка отвечает быстро. Панель Pterodactyl очень удобная для управления.",
      en: "Excellent hosting! Server runs stable, support responds quickly. Pterodactyl panel is very convenient for management.",
      ua: "Відмінний хостинг! Сервер працює стабільно, підтримка відповідає швидко. Панель Pterodactyl дуже зручна для управління.",
    },
    rating: 5,
    source: "Discord",
  },
  {
    name: {
      ru: "Мария Сидорова",
      en: "Maria Sidorova",
      ua: "Марія Сидорова",
    },
    role: {
      ru: "Администратор игрового проекта",
      en: "Gaming Project Administrator",
      ua: "Адміністратор ігрового проекту",
    },
    content: {
      ru: "Пользуемся уже полгода. Никаких проблем с производительностью, DDoS защита работает отлично. Рекомендую!",
      en: "We've been using it for six months. No performance issues, DDoS protection works great. Recommend!",
      ua: "Користуємося вже півроку. Жодних проблем з продуктивністю, DDoS захист працює відмінно. Рекомендую!",
    },
    rating: 5,
    source: "Telegram",
  },
  {
    name: {
      ru: "Дмитрий Козлов",
      en: "Dmitry Kozlov",
      ua: "Дмитро Козлов",
    },
    role: {
      ru: "Разработчик игр",
      en: "Game Developer",
      ua: "Розробник ігор",
    },
    content: {
      ru: "Лучший хостинг для тестирования игровых серверов. Быстрый запуск, гибкие настройки, адекватные цены.",
      en: "Best hosting for testing game servers. Fast launch, flexible settings, reasonable prices.",
      ua: "Найкращий хостинг для тестування ігрових серверів. Швидкий запуск, гнучкі налаштування, адекватні ціни.",
    },
    rating: 5,
    source: "Trustpilot",
  },
]

// Дополнительные услуги
export const services = [
  {
    title: {
      ru: "Автоматические бэкапы",
      en: "Automatic Backups",
      ua: "Автоматичні бекапи",
    },
    description: {
      ru: "Ежедневное резервное копирование данных с возможностью быстрого восстановления",
      en: "Daily data backup with quick recovery option",
      ua: "Щоденне резервне копіювання даних з можливістю швидкого відновлення",
    },
  },
  {
    title: {
      ru: "Анти-DDoS защита",
      en: "Anti-DDoS Protection",
      ua: "Анти-DDoS захист",
    },
    description: {
      ru: "Многоуровневая защита от DDoS атак мощностью до 1 Тбит/с",
      en: "Multi-level DDoS protection up to 1 Tbps",
      ua: "Багаторівневий захист від DDoS атак потужністю до 1 Тбіт/с",
    },
  },
  {
    title: {
      ru: "Техподдержка 24/7",
      en: "24/7 Tech Support",
      ua: "Техпідтримка 24/7",
    },
    description: {
      ru: "Круглосуточная поддержка через Discord, Telegram и тикет-систему",
      en: "24/7 support via Discord, Telegram and ticket system",
      ua: "Цілодобова підтримка через Discord, Telegram та тікет-систему",
    },
  },
  {
    title: {
      ru: "Быстрый запуск",
      en: "Fast Launch",
      ua: "Швидкий запуск",
    },
    description: {
      ru: "Автоматическая установка и настройка сервера за считанные минуты",
      en: "Automatic server installation and setup in minutes",
      ua: "Автоматичне встановлення та налаштування сервера за лічені хвилини",
    },
  },
  {
    title: {
      ru: "CDN оптимизация",
      en: "CDN Optimization",
      ua: "CDN оптимізація",
    },
    description: {
      ru: "Глобальная сеть доставки контента для минимальных задержек",
      en: "Global content delivery network for minimal latency",
      ua: "Глобальна мережа доставки контенту для мінімальних затримок",
    },
  },
  {
    title: {
      ru: "Гибкие настройки",
      en: "Flexible Settings",
      ua: "Гнучкі налаштування",
    },
    description: {
      ru: "Полный контроль над конфигурацией сервера через панель Pterodactyl",
      en: "Full control over server configuration via Pterodactyl panel",
      ua: "Повний контроль над конфігурацією сервера через панель Pterodactyl",
    },
  },
]
