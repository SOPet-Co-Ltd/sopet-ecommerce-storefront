import type { CheckoutAddressFormData } from "@/components/molecules/AddressForm/schema"
import { getShippingAddressFingerprint } from "@/lib/checkout/address-to-cart-shipping"

const syncedAddressByCartId = new Map<string, string>()

export async function ensureCheckoutShippingAddressSynced(
  cartId: string,
  address: CheckoutAddressFormData
): Promise<boolean> {
  const fingerprint = getShippingAddressFingerprint(address)
  const cacheKey = `${cartId}:${fingerprint}`

  if (syncedAddressByCartId.get(cartId) === fingerprint) {
    return true
  }

  const response = await fetch("/api/checkout/sync-shipping-address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
    cache: "no-store",
  })

  if (!response.ok) {
    return false
  }

  syncedAddressByCartId.set(cartId, fingerprint)
  return true
}

export function isRealSellerId(sellerId: string): boolean {
  return (
    !sellerId.startsWith("handle:") &&
    !sellerId.startsWith("line:") &&
    !sellerId.startsWith("name:")
  )
}
