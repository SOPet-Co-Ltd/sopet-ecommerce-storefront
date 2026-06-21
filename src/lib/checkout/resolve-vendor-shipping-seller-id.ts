import type { ExtendedLineItem, GroupedItems } from "@/types/cart"
import { isRealSellerId } from "@/lib/checkout/sync-shipping-address-client"

export function resolveVendorShippingSellerId(
  sellerGroups: GroupedItems,
  sellerKey: string
): string | null {
  if (isRealSellerId(sellerKey)) {
    return sellerKey
  }

  const group = sellerGroups[sellerKey]
  const groupSellerId = group?.seller?.id

  if (groupSellerId && isRealSellerId(groupSellerId)) {
    return groupSellerId
  }

  for (const item of group?.items ?? []) {
    const extendedItem = item as ExtendedLineItem
    const metadata = (extendedItem.metadata ?? {}) as Record<string, unknown>
    const metadataSellerId = metadata.seller_id

    if (
      typeof metadataSellerId === "string" &&
      isRealSellerId(metadataSellerId)
    ) {
      return metadataSellerId
    }

    const productSellerId = extendedItem.product?.seller?.id
    if (
      typeof productSellerId === "string" &&
      isRealSellerId(productSellerId)
    ) {
      return productSellerId
    }
  }

  return null
}
