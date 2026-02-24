"use client"

import { useEffect, useRef } from "react"

const SESSION_KEY = "sopet_product_events_session_id"
const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

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
}

/**
 * Tracks product view by sending a single event to the backend on mount.
 * Uses session_id from sessionStorage for deduplication (one view per session per product per hour on backend).
 */
export function ProductViewTracker({
  productId,
  variantId,
}: ProductViewTrackerProps) {
  const sent = useRef(false)

  useEffect(() => {
    if (!productId || sent.current) return
    sent.current = true

    const sessionId = getOrCreateSessionId()

    fetch(`${BACKEND_URL}/store/product-events`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "view",
        product_id: productId,
        variant_id: variantId || undefined,
        session_id: sessionId || undefined,
      }),
    }).catch(() => {})
  }, [productId, variantId])

  return null
}
