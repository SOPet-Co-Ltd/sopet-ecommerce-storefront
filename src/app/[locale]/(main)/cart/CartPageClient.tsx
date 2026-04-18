"use client"

import { CartTemplate } from "@/components/organisms"
import { queryKeys } from "@/lib/react-query/query-keys"
import {
  mergeAnonymousCheckoutHoldIntoCustomerCart,
  restoreAnonymousCheckoutHoldToAnonymousCart,
} from "@/lib/data/local-customer-cart"
import {
  CartSource,
  useCartQuery,
  useChangeCartItemVariantMutation,
  useDeleteCartItemMutation,
  useUpdateCartItemMutation,
} from "@/hooks/useCartQuery"
import { useQueryClient } from "@tanstack/react-query"
import type { Cart } from "@/types/cart"
import type { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"

type CartPageClientProps = {
  initialCart: Cart | HttpTypes.StoreCart | null
  locale: string
  cartSource: CartSource
}

export const CartPageClient = ({
  initialCart,
  locale,
  cartSource,
}: CartPageClientProps) => {
  const queryClient = useQueryClient()
  const [checkoutRecoveryReady, setCheckoutRecoveryReady] = useState(false)
  const { data: cart } = useCartQuery({
    locale,
    source: cartSource,
    initialData: initialCart,
  })
  const updateItemMutation = useUpdateCartItemMutation(locale, cartSource)
  const deleteItemMutation = useDeleteCartItemMutation(locale, cartSource)
  const changeVariantMutation = useChangeCartItemVariantMutation(
    locale,
    cartSource
  )

  useEffect(() => {
    let cancelled = false

    const recoverCheckoutHold = async () => {
      try {
        if (cartSource === "anonymous") {
          const restored = restoreAnonymousCheckoutHoldToAnonymousCart()
          if (!restored || cancelled) {
            return
          }

          await queryClient.invalidateQueries({
            queryKey: queryKeys.cart.page(locale, "anonymous"),
          })
          return
        }

        const merged = await mergeAnonymousCheckoutHoldIntoCustomerCart().catch(
          () => false
        )

        if (!merged || cancelled) {
          return
        }

        await queryClient.invalidateQueries({
          queryKey: queryKeys.cart.page(locale, "customer"),
        })
      } finally {
        if (!cancelled) {
          setCheckoutRecoveryReady(true)
        }
      }
    }

    void recoverCheckoutHold()

    return () => {
      cancelled = true
    }
  }, [cartSource, locale, queryClient])

  if (!checkoutRecoveryReady && !cart) {
    return (
      <div className="container mx-auto py-20 text-center px-4">
        <h1 className="heading-xl mb-4">กำลังกู้คืนตะกร้า...</h1>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="container mx-auto py-20 text-center px-4">
        <h1 className="heading-xl mb-4">Your Cart is Empty</h1>
      </div>
    )
  }

  return (
    <CartTemplate
      cart={cart}
      locale={locale}
      onItemQuantityChange={async (itemId, quantity) => {
        await updateItemMutation.mutateAsync({
          itemId,
          quantity,
        })
      }}
      onItemDelete={async (itemId) => {
        await deleteItemMutation.mutateAsync({
          itemId,
        })
      }}
      onItemVariantChange={async (
        itemId,
        variantId,
        quantity,
        unitPriceSnapshot
      ) => {
        await changeVariantMutation.mutateAsync({
          itemId,
          variantId,
          quantity,
          unitPriceSnapshot,
        })
      }}
    />
  )
}
