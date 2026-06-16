"use client"

import { useEffect, useRef } from "react"
import * as gtag from "@/lib/analytics/gtag"

const SESSION_KEY = "sopet_product_events_session_id"
const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim() ?? ""

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        crypto.randomUUID?.() ??
        `s${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}

type ProductViewTrackerProps = {
  productId: string
  variantId?: string
  product?: any // Accept any product type from Medusa
}

/**
 * Tracks product view by sending a single event to the backend on mount.
 * Uses session_id from sessionStorage for deduplication (one view per session per product per hour on backend).
 * Also tracks GA4 view_item event.
 */
export function ProductViewTracker({
  productId,
  variantId,
  product,
}: ProductViewTrackerProps) {
  const sent = useRef(false)

  useEffect(() => {
    if (!productId || sent.current) return
    if (!PUBLISHABLE_KEY) return
    sent.current = true

    const sessionId = getOrCreateSessionId()

    // Track backend view event
    fetch(`${BACKEND_URL}/store/product-events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        event_type: "view",
        product_id: productId,
        variant_id: variantId || undefined,
        session_id: sessionId || undefined,
      }),
    }).catch(() => {})

    // Track GA4 view_item event
    if (product) {
      const variant = product.variants?.[0]
      const price = variant?.calculated_price?.calculated_amount
        ? variant.calculated_price.calculated_amount / 100
        : undefined

      gtag.viewItem({
        currency:
          variant?.calculated_price?.currency_code?.toUpperCase() || "THB",
        value: price,
        items: [
          {
            item_id: productId,
            item_name: product.title || "Product",
            currency:
              variant?.calculated_price?.currency_code?.toUpperCase() || "THB",
            price,
            item_category: product.categories?.[0]?.name,
            item_category2: product.categories?.[1]?.name,
            item_brand: product.collection?.title,
            quantity: 1,
          },
        ],
      })
    }
  }, [productId, variantId, product])

  return null
}
