import type { AddressFormData } from "../AddressForm/schema"
import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"

export function customerAddressToFormValues(
  address: StoreCustomerAddress,
  customer: StoreCustomer | null | undefined
): AddressFormData {
  const recipientFullName =
    [address.first_name, address.last_name].filter(Boolean).join(" ").trim() ||
    address.address_name ||
    ""
  return {
    addressId: address.id,
    recipientFullName,
    phone: address.phone ?? "",
    email: customer?.email ?? "",
    province: address.province ?? "",
    district: address.address_2 ?? "",
    subDistrict: address.city ?? "",
    postalCode: address.postal_code ?? "",
    address: address.address_1 ?? "",
    setAsDefault: false,
    recipientphone: (address.metadata?.recipientphone as string) ?? "",
  }
}
