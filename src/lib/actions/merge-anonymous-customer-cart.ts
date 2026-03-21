"use server"

import { mergeAnonymousCustomerCart } from "@/lib/data/customer-cart"
import type { AnonymousCartItemInput } from "@/types/customer-cart"

/**
 * Server action bridge for merging anonymous cart items into the
 * authenticated customer's customer-cart.
 *
 * This runs on the server with proper auth headers (via getAuthHeaders)
 * so it works for all auth flows (OAuth, email, phone OTP, etc.).
 */
export async function mergeAnonymousCustomerCartFromClient(
  items: AnonymousCartItemInput[]
) {
  return mergeAnonymousCustomerCart(items)
}
