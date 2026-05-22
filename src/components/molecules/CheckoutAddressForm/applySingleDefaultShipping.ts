import { StoreCustomerAddress } from "@medusajs/types"

export function applySingleDefaultShipping(
  addresses: StoreCustomerAddress[],
  defaultAddressId: string
): StoreCustomerAddress[] {
  return addresses.map((item) => ({
    ...item,
    is_default_shipping: item.id === defaultAddressId,
  }))
}

export function normalizeAddressDefaults(
  addresses: StoreCustomerAddress[]
): StoreCustomerAddress[] {
  const defaultId = addresses.find((a) => a.is_default_shipping)?.id
  if (!defaultId) return addresses

  const defaultCount = addresses.filter((a) => a.is_default_shipping).length
  if (defaultCount <= 1) return addresses

  return applySingleDefaultShipping(addresses, defaultId)
}
