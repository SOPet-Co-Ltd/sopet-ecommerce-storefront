"use client"

import { useEffect, useRef } from "react"
import * as gtag from "@/lib/analytics/gtag"
import { convertOrderLineItemToGA4Item } from "@/lib/analytics/helpers"
import type { OrderDetails } from "@/types/order"

const PURCHASE_TRACKED_PREFIX = "sopet_purchase_tracked_"

type OrderPurchaseTrackerProps = {
  order: OrderDetails
}

function getOrderCouponCode(order: OrderDetails): string | undefined {
  for (const item of order.items) {
    const code = item.adjustments?.find((adj) => adj.code)?.code
    if (code) return code
  }
  return undefined
}

/**
 * Tracks purchase event once per order on the confirmation page.
 */
export function OrderPurchaseTracker({ order }: OrderPurchaseTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !order?.id || !order.items?.length) return

    const storageKey = `${PURCHASE_TRACKED_PREFIX}${order.id}`
    try {
      if (sessionStorage.getItem(storageKey)) {
        tracked.current = true
        return
      }
    } catch {
      // sessionStorage unavailable
    }

    tracked.current = true

    const currency = order.currency_code?.toUpperCase() || "THB"
    const items = order.items.map((item) =>
      convertOrderLineItemToGA4Item(item, currency)
    )

    gtag.purchase({
      transaction_id: order.id,
      currency,
      value: order.total / 100,
      shipping: order.shipping_total / 100,
      items,
      coupon: getOrderCouponCode(order),
    })

    try {
      sessionStorage.setItem(storageKey, "1")
    } catch {
      // sessionStorage unavailable
    }
  }, [order])

  return null
}
