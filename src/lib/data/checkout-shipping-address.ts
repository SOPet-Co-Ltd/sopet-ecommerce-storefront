"use server"

import type { CheckoutAddressFormData } from "@/components/molecules/AddressForm/schema"
import { addressFormDataToCartUpdate } from "@/lib/checkout/address-to-cart-shipping"
import { updateCart } from "@/lib/data/cart"

export async function syncCheckoutShippingAddressToCart(
  address: CheckoutAddressFormData
) {
  const payload = addressFormDataToCartUpdate(address)
  return updateCart(payload)
}
