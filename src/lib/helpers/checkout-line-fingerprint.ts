import type { Cart } from "@/types/cart"

/** Stable fingerprint for cart line ids and quantities (used to skip redundant checkout cap runs). */
export function checkoutLineFingerprint(cart: Cart): string {
  return (cart.items ?? [])
    .map((i) => `${i.id}:${i.quantity}`)
    .sort()
    .join("|")
}
