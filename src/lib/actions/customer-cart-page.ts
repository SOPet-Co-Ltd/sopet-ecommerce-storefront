"use server"

import { getCartForCustomerCartPage } from "@/lib/data/customer-cart-page"
import type { Cart } from "@/types/cart"
import type { HttpTypes } from "@medusajs/types"

/**
 * Server action to fetch the latest customer-backed cart structure for
 * the cart page, including products and computed totals.
 */
export async function getCustomerCartForClient(
  locale: string
): Promise<Cart | HttpTypes.StoreCart | null> {
  return getCartForCustomerCartPage(locale)
}
