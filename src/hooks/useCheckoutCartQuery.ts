"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/react-query/query-keys"
import type { Cart } from "@/types/cart"

type CheckoutCartResponse = {
  cart?: Cart | null
  message?: string
}

type UseCheckoutCartQueryArgs = {
  cartId: string
  initialData: Cart
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchCheckoutCart(cartId: string): Promise<Cart | null> {
  const response = await fetch(
    `/api/checkout/cart?cartId=${encodeURIComponent(cartId)}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const payload = await parseJson<CheckoutCartResponse>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดข้อมูลตะกร้าสำหรับ checkout ได้")
  }

  const payload = await parseJson<CheckoutCartResponse>(response)
  return payload.cart ?? null
}

export function useCheckoutCartQuery({
  cartId,
  initialData,
}: UseCheckoutCartQueryArgs) {
  return useQuery({
    queryKey: queryKeys.checkout.cart(cartId),
    queryFn: () => fetchCheckoutCart(cartId),
    initialData,
    enabled: Boolean(cartId),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  })
}
