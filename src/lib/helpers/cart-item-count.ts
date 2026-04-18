import { HttpTypes } from "@medusajs/types"

import type { Cart } from "@/types/cart"

export function getCartItemCount(
  cart: Cart | HttpTypes.StoreCart | null | undefined
) {
  return (
    cart?.items?.reduce((count, item) => count + (item.quantity ?? 0), 0) || 0
  )
}
