import type { Cart, StoreCardShippingMethod } from "@/types/cart"
import { getCartItemSellerGroup } from "@/lib/helpers/cart-seller"

type CartShippingMethod = {
  shipping_option_id?: string | null
}

type SellerFingerprint = {
  key: string
  ids: Set<string>
  names: Set<string>
  handles: Set<string>
}

function normalizeIdentifier(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

function pushIdentifier(
  target: Set<string>,
  value: string | null | undefined
) {
  const normalized = normalizeIdentifier(value)

  if (normalized) {
    target.add(normalized)
  }
}

function getCartSellerFingerprints(cart: Cart): SellerFingerprint[] {
  const grouped = new Map<string, SellerFingerprint>()

  for (const item of cart.items ?? []) {
    const { key, seller } = getCartItemSellerGroup(item)

    if (!key || !seller) {
      continue
    }

    const current =
      grouped.get(key) ??
      {
        key,
        ids: new Set<string>(),
        names: new Set<string>(),
        handles: new Set<string>(),
      }

    pushIdentifier(current.ids, seller.id)
    pushIdentifier(current.names, seller.name)
    pushIdentifier(current.handles, seller.handle)

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
}

function matchesShippingOption(
  fingerprint: SellerFingerprint,
  option: StoreCardShippingMethod
) {
  const optionSellerId = normalizeIdentifier(option.seller_id)
  const optionSellerName = normalizeIdentifier(option.seller_name)
  const optionSellerHandle = normalizeIdentifier(
    (option as { seller_handle?: string | null }).seller_handle
  )

  return (
    (optionSellerId !== null && fingerprint.ids.has(optionSellerId)) ||
    (optionSellerName !== null && fingerprint.names.has(optionSellerName)) ||
    (optionSellerHandle !== null && fingerprint.handles.has(optionSellerHandle))
  )
}

function getSelectedShippingBySeller(
  cart: Cart,
  shippingOptions: StoreCardShippingMethod[],
  sellerFingerprints: SellerFingerprint[]
): Map<string, string> {
  const selected = new Map<string, string>()

  for (const shippingMethod of (cart.shipping_methods ?? []) as CartShippingMethod[]) {
    const optionId = shippingMethod.shipping_option_id?.trim()
    if (!optionId) continue

    const option = shippingOptions.find((candidate) => candidate.id === optionId)
    if (!option) continue

    const matchedFingerprint = sellerFingerprints.find((fingerprint) =>
      matchesShippingOption(fingerprint, option)
    )

    if (!matchedFingerprint || selected.has(matchedFingerprint.key)) continue

    selected.set(matchedFingerprint.key, optionId)
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

  const sellerFingerprints = getCartSellerFingerprints(cart)
  if (sellerFingerprints.length === 0) {
    return { optionIds: [], needsPersist: false }
  }

  const selectedBySeller = getSelectedShippingBySeller(
    cart,
    options,
    sellerFingerprints
  )
  let needsPersist = false

  for (const fingerprint of sellerFingerprints) {
    if (selectedBySeller.has(fingerprint.key)) {
      continue
    }

    const defaultOption = options.find((option) =>
      matchesShippingOption(fingerprint, option)
    )
    if (!defaultOption?.id) {
      continue
    }

    selectedBySeller.set(fingerprint.key, defaultOption.id)
    needsPersist = true
  }

  return {
    optionIds: Array.from(selectedBySeller.values()),
    needsPersist,
  }
}
