import type { StoreCardShippingMethod } from "@/types/cart"

/** Client-safe vendor shipping fetch (avoids importing `"use server"` modules in Zustand). */
export async function fetchVendorShippingMethods(
  cartId: string,
  sellerId: string
): Promise<StoreCardShippingMethod[] | null> {
  const params = new URLSearchParams({ cartId, sellerId })

  try {
    const response = await fetch(
      `/api/checkout/vendor-shipping?${params.toString()}`,
      { cache: "no-store" }
    )

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      shipping_options?: StoreCardShippingMethod[] | null
    }

    return payload.shipping_options ?? []
  } catch {
    return null
  }
}
