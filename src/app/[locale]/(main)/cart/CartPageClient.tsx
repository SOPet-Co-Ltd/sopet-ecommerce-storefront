"use client"

import { CartTemplate } from "@/components/organisms"
import {
  CartSource,
  useCartQuery,
  useChangeCartItemVariantMutation,
  useDeleteCartItemMutation,
  useUpdateCartItemMutation,
} from "@/hooks/useCartQuery"
import type { Cart } from "@/types/cart"
import type { HttpTypes } from "@medusajs/types"

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
