import type { Cart, StoreCardShippingMethod } from "@/types/cart"

type CartSeller = {
  id?: string | null
}

type CartItemWithSeller = {
  product?: {
    seller?: CartSeller | null
  } | null
}

type CartShippingMethod = {
  shipping_option_id?: string | null
}

function getCartSellerIds(cart: Cart): string[] {
  return Array.from(
    new Set(
      (cart.items ?? [])
        .map(
          (item) =>
            (item as CartItemWithSeller)?.product?.seller?.id?.trim() ?? null
        )
        .filter((sellerId): sellerId is string => Boolean(sellerId))
    )
  )
}

function getSelectedShippingBySeller(
  cart: Cart,
  shippingOptions: StoreCardShippingMethod[]
): Map<string, string> {
  const selected = new Map<string, string>()

  for (const shippingMethod of (cart.shipping_methods ?? []) as CartShippingMethod[]) {
    const optionId = shippingMethod.shipping_option_id?.trim()
    if (!optionId) continue

    const option = shippingOptions.find((candidate) => candidate.id === optionId)
    const sellerId = option?.seller_id?.trim()
    if (!sellerId || selected.has(sellerId)) continue

    selected.set(sellerId, optionId)
  }

  return selected
}

export function buildCartDefaultShippingSelection(
  cart: Cart,
  shippingOptions: StoreCardShippingMethod[] | null | undefined
): {
  optionIds: string[]
  needsPersist: boolean
} {
  const options = shippingOptions ?? []
  if (!cart?.id || options.length === 0) {
    return { optionIds: [], needsPersist: false }
  }

  const sellerIds = getCartSellerIds(cart)
  if (sellerIds.length === 0) {
    return { optionIds: [], needsPersist: false }
  }

  const selectedBySeller = getSelectedShippingBySeller(cart, options)
  let needsPersist = false

  for (const sellerId of sellerIds) {
    if (selectedBySeller.has(sellerId)) {
      continue
    }

    const defaultOption = options.find((option) => option.seller_id === sellerId)
    if (!defaultOption?.id) {
      continue
    }

    selectedBySeller.set(sellerId, defaultOption.id)
    needsPersist = true
  }

  return {
    optionIds: Array.from(selectedBySeller.values()),
    needsPersist,
  }
}
