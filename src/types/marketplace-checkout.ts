/** Mirrors backend `src/lib/marketplace-checkout.ts` for cart metadata and prepare API. */

export const MP_CHECKOUT_META_KEY = "mp_checkout_v1" as const

export type MpCheckoutSliceMeta = {
  seller_id: string
  payment_collection_id: string
  line_item_ids: string[]
  raw_total: string | number
}

export type MpCheckoutV1 = {
  version: 1
  cart_id: string
  slices: MpCheckoutSliceMeta[]
}

export function parseMpCheckoutFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): MpCheckoutV1 | null {
  if (!metadata || typeof metadata !== "object") return null
  const raw = metadata[MP_CHECKOUT_META_KEY]
  if (!raw || typeof raw !== "object") return null
  const mp = raw as Partial<MpCheckoutV1>
  if (mp.version !== 1 || !Array.isArray(mp.slices) || !mp.cart_id) return null
  return mp as MpCheckoutV1
}
