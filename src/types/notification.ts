export type NotificationTab = "noti" | "promo"

export type OrderNotificationEventType =
  | "to-pay"
  | "preparing"
  | "to-receive"
  | "completed"
  | "cancelled"

export type OrderNotificationItem = {
  id: string
  kind: "order"
  orderId: string
  eventType: OrderNotificationEventType
  title: string
  description: string
  occurredAt: string
  dateLabel: string
  image: string
  href: string
}

export type PromotionNotificationItem = {
  id: string
  kind: "promotion"
  title: string
  description: string
  occurredAt: string
  dateLabel: string
  image: string
  isUnread: boolean
  href: string
}
