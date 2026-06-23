"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import type { Cart } from "@/types/cart"
import { queryKeys } from "@/lib/react-query/query-keys"

type CheckoutCartQuerySeedProps = {
  cart: Cart
}

export function CheckoutCartQuerySeed({ cart }: CheckoutCartQuerySeedProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.setQueryData(queryKeys.checkout.cart(cart.id), cart)
  }, [cart, queryClient])

  return null
}
