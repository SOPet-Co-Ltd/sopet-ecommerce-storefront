import type { HttpTypes } from "@medusajs/types"

import type { CheckoutAddressFormData } from "@/components/molecules/AddressForm/schema"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"

export function splitRecipientName(fullName: string): {
  firstName: string
  lastName: string
} {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length <= 1) {
    return { firstName: trimmed, lastName: "" }
  }

  return {
    firstName: parts[0] ?? trimmed,
    lastName: parts.slice(1).join(" "),
  }
}

export function addressFormDataToCartUpdate(
  address: CheckoutAddressFormData
): HttpTypes.StoreUpdateCart {
  const { firstName, lastName } = splitRecipientName(address.recipientFullName)
  const email =
    address.email?.trim() ||
    (address.contactPhone
      ? `${normalizeThaiPhoneNumber(address.contactPhone)}@sopet.org`
      : undefined)

  return {
    ...(email ? { email } : {}),
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address_1: address.address,
      address_2: address.district,
      city: address.subDistrict,
      province: address.province,
      postal_code: address.postalCode,
      country_code: "th",
      phone: normalizeThaiPhoneNumber(address.phone),
      company: "",
    },
  }
}

export function getShippingAddressFingerprint(
  address: CheckoutAddressFormData
): string {
  return [
    address.recipientFullName,
    address.phone,
    address.contactPhone ?? "",
    address.province,
    address.district,
    address.subDistrict,
    address.postalCode,
    address.address,
  ].join("|")
}
