"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PrivacyPolicyProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Политика конфиденциальности</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
            <p className="text-muted-foreground">
              Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей
              сервиса Host. Используя наши услуги, вы соглашаетесь с условиями данной политики.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">2. Сбор информации</h3>
            <p className="text-muted-foreground mb-2">Мы собираем следующие типы информации:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Контактные данные (имя, email, телефон)</li>
              <li>Платежная информация для обработки заказов</li>
              <li>Техническая информация о использовании сервисов</li>
              <li>Логи доступа и активности на серверах</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">3. Использование данных</h3>
            <p className="text-muted-foreground mb-2">Персональные данные используются для:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Предоставления хостинг-услуг</li>
              <li>Обработки платежей и выставления счетов</li>
              <li>Технической поддержки пользователей</li>
              <li>Информирования об изменениях в сервисе</li>
              <li>Обеспечения безопасности и предотвращения мошенничества</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">4. Защита данных</h3>
            <p className="text-muted-foreground">
              Мы применяем современные технические и организационные меры для защиты персональных данных от
              несанкционированного доступа, изменения, раскрытия или уничтожения. Все данные передаются по защищенным
              каналам связи с использованием SSL-шифрования.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">5. Передача третьим лицам</h3>
            <p className="text-muted-foreground">
              Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных
              законодательством, или с явного согласия пользователя. Мы можем использовать услуги проверенных партнеров
              для обработки платежей.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">6. Права пользователей</h3>
            <p className="text-muted-foreground mb-2">Вы имеете право:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Получать информацию об обработке ваших данных</li>
              <li>Требовать исправления неточных данных</li>
              <li>Требовать удаления персональных данных</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">7. Контактная информация</h3>
            <p className="text-muted-foreground">
              По вопросам обработки персональных данных обращайтесь: support@host.com
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">8. Изменения политики</h3>
            <p className="text-muted-foreground">
              Мы оставляем за собой право изменять данную политику. Актуальная версия всегда доступна на нашем сайте.
              Существенные изменения будут доведены до сведения пользователей заблаговременно.
            </p>
          </section>

          <p className="text-sm text-muted-foreground">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
