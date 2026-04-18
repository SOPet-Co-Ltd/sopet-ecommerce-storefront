"use server"

import { listCampaigns, type CampaignListItem } from "@/lib/data/campaigns"
import { fetchCoupons, type CouponApiData } from "@/lib/data/coupons"
import { listOrders } from "@/lib/data/orders"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"
import type {
  OrderNotificationItem,
  OrderNotificationEventType,
  PromotionNotificationItem,
} from "@/types/notification"
import type { OrderListItem } from "@/types/order"

export type NotificationsPageBundleData = {
  notifications: OrderNotificationItem[]
  promotions: PromotionNotificationItem[]
}

const ORDER_LIMIT = 100
const PROMO_LIMIT = 50
const PROMO_NEW_MS = 7 * 24 * 60 * 60 * 1000

const TH_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

function formatDateLabel(dateString: string): string {
  return new Date(dateString).toLocaleString("th-TH", TH_DATE_TIME)
}

function isPromotionUnread(dateString?: string | null) {
  if (!dateString) return false
  const promoDate = new Date(dateString).getTime()
  return Date.now() - promoDate < PROMO_NEW_MS
}

function sortIsoDateAsc(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime()
}

function sortIsoDateDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime()
}

function getOrderImage(order: OrderListItem): string {
  return order.items?.[0]?.thumbnail || "/images/placeholder.svg"
}

function getOrderDisplayId(order: OrderListItem): string {
  return String(order.display_id)
}

function getCapturedAt(order: OrderListItem): string | null {
  const capturedDates = (order.payment_collections ?? [])
    .flatMap((collection) => collection.payments ?? [])
    .map((payment) => payment.captured_at)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort(sortIsoDateAsc)

  return capturedDates[0] ?? null
}

function getFirstShippedAt(order: OrderListItem): string | null {
  const shippedDates = (order.fulfillments ?? [])
    .map((fulfillment) => fulfillment.shipped_at)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort(sortIsoDateAsc)

  return shippedDates[0] ?? null
}

function getLatestDeliveredAt(order: OrderListItem): string | null {
  const deliveredDates = (order.fulfillments ?? [])
    .map((fulfillment) => fulfillment.delivered_at)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort(sortIsoDateDesc)

  return deliveredDates[0] ?? null
}

function getEventCopy(
  order: OrderListItem,
  eventType: OrderNotificationEventType
): Pick<OrderNotificationItem, "title" | "description"> {
  const displayId = getOrderDisplayId(order)

  switch (eventType) {
    case "to-pay":
      return {
        title: "คำสั่งซื้อของคุณรอการชำระเงิน",
        description: `คำสั่งซื้อหมายเลข ${displayId} รอการชำระเงิน`,
      }
    case "preparing":
      return {
        title: "คำสั่งซื้อของคุณกำลังเตรียมการจัดส่ง",
        description: `ผู้ขายได้รับคำสั่งซื้อหมายเลข ${displayId} แล้ว กำลังเตรียมการจัดส่ง`,
      }
    case "to-receive":
      return {
        title: "คำสั่งซื้อของคุณอยู่ระหว่างจัดส่ง",
        description: `คำสั่งซื้อหมายเลข ${displayId} ถูกจัดส่งแล้ว`,
      }
    case "completed":
      return {
        title: "คำสั่งซื้อของคุณสำเร็จแล้ว",
        description: `คำสั่งซื้อหมายเลข ${displayId} สำเร็จเรียบร้อยแล้ว`,
      }
    case "cancelled":
      return {
        title: "คำสั่งซื้อของคุณถูกยกเลิก",
        description: `คำสั่งซื้อหมายเลข ${displayId} ถูกยกเลิก`,
      }
  }
}

function buildOrderNotificationEvent(
  order: OrderListItem,
  eventType: OrderNotificationEventType,
  occurredAt: string
): OrderNotificationItem {
  const { title, description } = getEventCopy(order, eventType)

  return {
    id: `${order.id}:${eventType}:${occurredAt}`,
    kind: "order",
    orderId: order.id,
    eventType,
    title,
    description,
    occurredAt,
    dateLabel: formatDateLabel(occurredAt),
    image: getOrderImage(order),
    href: `/user/orders/${order.id}`,
  }
}

function buildOrderNotificationTimeline(order: OrderListItem): OrderNotificationItem[] {
  const events: OrderNotificationItem[] = []
  const displayStatus = getOrderDisplayStatus(order)
  const capturedAt = getCapturedAt(order)
  const shippedAt = getFirstShippedAt(order)
  const deliveredAt = getLatestDeliveredAt(order)
  const createdAt = order.created_at
  const updatedAt = order.updated_at
  const effectivePaymentStatus =
    order.metadata?.is_paid === true ? "captured" : order.payment_status

  if (displayStatus === "to-pay") {
    events.push(buildOrderNotificationEvent(order, "to-pay", createdAt))
  }

  if ((effectivePaymentStatus === "captured" || order.metadata?.is_paid === true) && capturedAt) {
    events.push(buildOrderNotificationEvent(order, "preparing", capturedAt))
  }

  if (shippedAt) {
    events.push(buildOrderNotificationEvent(order, "to-receive", shippedAt))
  }

  if (displayStatus === "completed") {
    events.push(
      buildOrderNotificationEvent(order, "completed", deliveredAt || updatedAt)
    )
  }

  if (displayStatus === "cancelled") {
    events.push(buildOrderNotificationEvent(order, "cancelled", updatedAt))
  }

  return events
}

function mapCampaignsAndCouponsToPromotions(
  campaigns: CampaignListItem[],
  coupons: CouponApiData[]
): PromotionNotificationItem[] {
  return [
    ...campaigns.map((campaign) => {
      const occurredAt = campaign.created_at || new Date(0).toISOString()

      return {
        id: `camp_${campaign.id}`,
        kind: "promotion" as const,
        title: campaign.name || "โปรโมชั่นพิเศษ",
        description: campaign.description || "รายละเอียดโปรโมชั่น",
        occurredAt,
        dateLabel: formatDateLabel(occurredAt),
        image: "/images/placeholder.svg",
        isUnread: isPromotionUnread(campaign.created_at),
        href: "/coupons",
      }
    }),
    ...coupons.map((coupon) => {
      const occurredAt =
        coupon.created_at &&
        !Number.isNaN(new Date(coupon.created_at).getTime())
          ? new Date(coupon.created_at).toISOString()
          : new Date(0).toISOString()

      return {
        id: `coup_${coupon.id}`,
        kind: "promotion" as const,
        title: coupon.title || `โค้ดส่วนลด: ${coupon.code}`,
        description:
          coupon.description || `ใช้โค้ด ${coupon.code} เพื่อรับส่วนลด`,
        occurredAt,
        dateLabel: coupon.expiry_date ? `ใช้ได้ถึง: ${coupon.expiry_date}` : "",
        image: "/images/placeholder.svg",
        isUnread: true,
        href: "/coupons",
      }
    }),
  ].sort((a, b) => sortIsoDateDesc(a.occurredAt, b.occurredAt))
}

export async function getNotificationsPageBundleData(): Promise<NotificationsPageBundleData> {
  const [orders, campaigns, coupons] = await Promise.all([
    listOrders(ORDER_LIMIT, 0),
    listCampaigns(PROMO_LIMIT, 0),
    fetchCoupons(undefined, PROMO_LIMIT, 0),
  ])

  const notifications = orders
    .flatMap((order) => buildOrderNotificationTimeline(order))
    .sort((a, b) => sortIsoDateDesc(a.occurredAt, b.occurredAt))

  const promotions = mapCampaignsAndCouponsToPromotions(campaigns || [], coupons || [])

  return {
    notifications,
    promotions,
  }
}
