import { useMemo } from "react"

import { HttpTypes } from "@medusajs/types"
import compareAddresses from "@/lib/helpers/compare-addresses"
import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import { normalizeSearch } from "@/lib/data/thai-address-helpers"
import type { SearchableOption } from "@/components/molecules/SearchableSelect/types"

type AddressSelectProps = {
  addresses: HttpTypes.StoreCustomerAddress[]
  addressInput: HttpTypes.StoreCartAddress | null
  onSelect: (
    address: HttpTypes.StoreCartAddress | undefined,
    email?: string
  ) => void
}

const AddressSelect = ({
  addresses,
  addressInput,
  onSelect,
}: AddressSelectProps) => {
  const addressOptions = useMemo<SearchableOption[]>(
    () =>
      addresses.map((address) => {
        const addressLine = [
          address.address_1,
          address.address_2,
          address.postal_code,
          address.city,
          address.province,
          address.country_code,
        ]
          .filter(Boolean)
          .join(" ")

        return {
          value: address.id,
          label: address.address_name ?? addressLine,
          searchText: normalizeSearch(
            `${address.address_name} ${address.first_name} ${address.last_name} ${addressLine}`
          ),
          address,
        }
      }),
    [addresses]
  )

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => compareAddresses(a, addressInput))
  }, [addresses, addressInput])

  const renderAddressOption = (option: SearchableOption) => {
    const address = option.address as HttpTypes.StoreCustomerAddress
    return (
      <>
        <span className="font-semibold">{address.address_name}</span>
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <div className="min-w-0">
            <span className="text-left text-base-semi block">
              {address.first_name} {address.last_name}
            </span>
            {address.company && (
              <span className="text-small-regular text-ui-fg-base">
                {address.company}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col text-left text-base-regular">
            <span>
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span>
              {address.postal_code}, {address.city}
            </span>
            <span>
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
          </div>
        </div>
      </>
    )
  }

  return (
    <SearchableSelect
      value={selectedAddress?.id ?? ""}
      onChange={(id) => {
        const savedAddress = addresses.find((a) => a.id === id)
        if (savedAddress) {
          onSelect(savedAddress as HttpTypes.StoreCartAddress)
        }
      }}
      options={addressOptions}
      placeholder="Choose an address"
      hideTitle
      isRequire={false}
      renderOption={renderAddressOption}
      dropdownWidth="content"
    />
  )
}

export default AddressSelect
