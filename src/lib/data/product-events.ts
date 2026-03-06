"use server"

import { getAuthHeaders } from "./cookies"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export type ProductEventType =
  | "view"
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "remove_from_wishlist"
  | "purchase"

/**
 * Sends a product event to the backend for analytics and recommendations.
 * Call from server actions (e.g. after add to cart/wishlist) or from client via fetch with session_id.
 */
export async function trackProductEvent({
  event_type,
  product_id,
  variant_id,
  session_id,
}: {
  event_type: ProductEventType
  product_id?: string
  variant_id?: string
  session_id?: string
}): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key":
      (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string) || "",
    ...(await getAuthHeaders()),
  }

  try {
    await fetch(`${BACKEND_URL}/store/product-events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event_type,
        product_id: product_id?.trim(),
        variant_id: variant_id?.trim(),
        session_id: session_id?.trim(),
      }),
    })
  } catch {
    // Fire-and-forget; do not fail the main action
  }
}
