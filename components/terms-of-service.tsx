"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TermsOfServiceProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsOfService({ isOpen, onClose }: TermsOfServiceProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Условия обслуживания</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">1. Общие условия</h3>
            <p className="text-muted-foreground">
              Настоящие Условия обслуживания регулируют отношения между Host и пользователями наших услуг. Используя
              наши сервисы, вы принимаете данные условия в полном объеме.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">2. Предоставляемые услуги</h3>
            <p className="text-muted-foreground mb-2">Host предоставляет следующие услуги:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Хостинг игровых серверов (Minecraft, CS, и др.)</li>
              <li>VPS и выделенные серверы</li>
              <li>Веб-хостинг для сайтов</li>
              <li>Техническая поддержка пользователей</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">3. Обязательства клиента</h3>
            <p className="text-muted-foreground mb-2">Клиент обязуется:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Предоставлять достоверную информацию при регистрации</li>
              <li>Своевременно оплачивать услуги согласно выбранному тарифу</li>
              <li>Не использовать сервисы для незаконной деятельности</li>
              <li>Не нарушать работу серверов и сетевой инфраструктуры</li>
              <li>Соблюдать авторские права и лицензионные соглашения</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">4. Запрещенное использование</h3>
            <p className="text-muted-foreground mb-2">Запрещается использование сервисов для:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Размещения вредоносного ПО, вирусов, троянов</li>
              <li>Спам-рассылок и фишинга</li>
              <li>Нарушения авторских прав</li>
              <li>Проведения DDoS атак</li>
              <li>Майнинга криптовалют (без согласования)</li>
              <li>Размещения контента для взрослых</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">5. Оплата и возврат средств</h3>
            <p className="text-muted-foreground">
              Оплата производится согласно выбранному тарифному плану. Возврат средств возможен в течение 7 дней с
              момента заказа при условии неиспользования более 10% ресурсов. Возврат не производится в случае нарушения
              условий обслуживания.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">6. Гарантии и ответственность</h3>
            <p className="text-muted-foreground">
              Мы гарантируем 99.9% времени работы сервисов. В случае превышения времени простоя предоставляется
              компенсация согласно SLA. Мы не несем ответственности за потерю данных клиента и рекомендуем регулярно
              создавать резервные копии.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">7. Приостановка и прекращение услуг</h3>
            <p className="text-muted-foreground">
              Услуги могут быть приостановлены или прекращены при нарушении условий обслуживания, неоплате счетов, или
              по требованию компетентных органов. Уведомление направляется за 24 часа до приостановки, кроме случаев
              критических нарушений.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">8. Изменение условий</h3>
            <p className="text-muted-foreground">
              Host оставляет за собой право изменять данные условия. Клиенты уведомляются об изменениях по email за 30
              дней до вступления в силу. Продолжение использования сервисов означает согласие с новыми условиями.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">9. Контактная информация</h3>
            <p className="text-muted-foreground">
              По всем вопросам обращайтесь: support@host.com или через систему тикетов в панели управления.
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
