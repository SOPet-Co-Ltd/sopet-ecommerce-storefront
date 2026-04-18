"use server"

import { fetchQuery } from "@/lib/config"
import { getAuthHeaders } from "./cookies"
import type { Cart } from "@/types/cart"

type CustomerCartPageResponse = {
  cart?: Cart | null
}

export async function getCartForCustomerCartPage(
  locale: string
): Promise<Cart | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery("/store/customer-cart/cart", {
    method: "GET",
    query: {
      country_code: locale,
    },
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  const payload = response.data as CustomerCartPageResponse | null

  return payload?.cart ?? null
}
