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
import * as gtag from "@/lib/analytics/gtag"
import { useCartPageUiStore } from "@/lib/zustand/cart-page-ui-store"

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
  const pendingQuantityItemIds = useCartPageUiStore(
    (state) => state.pendingQuantityItemIds
  )
  const isCartUpdating =
    updateItemMutation.isPending ||
    deleteItemMutation.isPending ||
    changeVariantMutation.isPending ||
    pendingQuantityItemIds.length > 0

  // Track GA4 view_cart event
  useEffect(() => {
    if (!cart?.items?.length) return

    const currency = cart.currency_code?.toUpperCase() || "THB"

    const items = cart.items.map((item) => ({
      item_id: item.variant_id || item.id,
      item_name: item.title || "Product",
      currency,
      price: item.unit_price ? item.unit_price / 100 : 0,
      quantity: item.quantity,
      item_category: (item.variant?.product as any)?.categories?.[0]?.name,
      item_brand: (item.variant?.product as any)?.collection?.title,
      item_variant: item.variant?.title || undefined,
    }))

    const totalValue = items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    )

    gtag.viewCart({
      currency,
      value: totalValue,
      items,
    })
  }, [cart?.id]) // Only track when cart ID changes (initial load or cart replaced)

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

  if (!checkoutRecoveryReady) {
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
      isCartUpdating={isCartUpdating}
      onItemQuantityChange={(itemId, quantity) =>
        new Promise<void>((resolve, reject) => {
          updateItemMutation.mutate(
            { itemId, quantity },
            {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
            }
          )
        })
      }
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
