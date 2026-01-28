import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { I18nProvider } from "@/lib/i18n/provider"
import { NotificationProvider } from "@/lib/websocket/notification-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "Host - Игровой хостинг нового уровня",
  description:
    "Мощные серверы с панелью управления Pterodactyl. Быстрый запуск, надежная защита и круглосуточная поддержка для вашего игрового проекта.",
  keywords: "игровой хостинг, minecraft хостинг, pterodactyl, vps, серверы",
  authors: [{ name: "Host" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hosting Panel",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Host - Игровой хостинг нового уровня",
    description: "Мощные серверы с панелью управления Pterodactyl",
    type: "website",
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <AuthProvider>
              <NotificationProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </NotificationProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Fix HTTPS redirect issue on localhost during development
              if (window.location.hostname === 'localhost' && window.location.protocol === 'https:') {
                // Redirect to HTTP version
                window.location.href = window.location.href.replace('https:', 'http:');
              } else if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Only register SW in production or on HTTP localhost
                  if (window.location.hostname !== 'localhost' || window.location.protocol === 'http:') {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('SW registered: ', registration);
                    }).catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
