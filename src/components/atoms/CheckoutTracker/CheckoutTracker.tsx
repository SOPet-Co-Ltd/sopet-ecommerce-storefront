"use client"

import { useEffect, useRef } from "react"
import * as gtag from "@/lib/analytics/gtag"
import type { Cart } from "@/types/cart"

type CheckoutTrackerProps = {
  cart: Cart
}

/**
 * Tracks begin_checkout event when checkout page loads
 */
export function CheckoutTracker({ cart }: CheckoutTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !cart?.items?.length) return
    tracked.current = true

    const currency = cart.currency_code?.toUpperCase() || "THB"

    const items = cart.items.map((item) => ({
      item_id: item.variant_id || item.id,
      item_name: item.title || "Product",
      currency,
      price: item.unit_price ? item.unit_price / 100 : 0,
      quantity: item.quantity,
      item_category: (item.variant?.product as any)?.categories?.[0]?.name,
      item_brand: (item.variant?.product as any)?.collection?.title,
      item_variant: item.variant?.title || undefined,
    }))

    const totalValue = items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    )

    gtag.beginCheckout({
      currency,
      value: totalValue,
      items,
    })
  }, [cart])

  return null
}
