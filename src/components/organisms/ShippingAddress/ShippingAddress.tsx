import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/atoms"
import AddressSelect from "@/components/cells/AddressSelect/AddressSelect"
import ThaiAddressSelect, {
  ThaiAddressValue,
} from "@/components/cells/ThaiAddressSelect/ThaiAddressSelect"
import { usePathname } from "next/navigation"
import { Cart } from "@/types/cart"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  prefilledPhone,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: Cart | null
  checked: boolean
  onChange: () => void
  prefilledPhone?: string
}) => {
  const pathname = usePathname()

  const locale = pathname.split("/")[1]
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || locale,
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && a.country_code === locale
      ),
    [customer?.addresses]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || locale,
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }

    if (prefilledPhone) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.phone": prefilledPhone,
      }))
    }
  }, [cart, prefilledPhone])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleThaiAddressChange = (value: ThaiAddressValue) => {
    setFormData((prev) => ({
      ...prev,
      "shipping_address.province": value.province,
      "shipping_address.city": value.district, // Map Amphoe to City
      "shipping_address.address_2": value.subdistrict, // Map Tambon to Address 2
      "shipping_address.postal_code": value.zipCode,
    }))
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-0">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
            <AddressSelect
              addresses={addressesInRegion || []}
              addressInput={
                mapKeys(formData, (_, key) =>
                  key.replace("shipping_address.", "")
                ) as HttpTypes.StoreCartAddress
              }
              onSelect={setFormAddress}
            />
          </div>
        </Container>
      )}

      {/* Name and Phone Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Input
          title="ชื่อ-นามสกุล ผู้รับสินค้า"
          name="shipping_address.first_name"
          placeholder="ชื่อ-นามสกุล"
          autoComplete="name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          title="เบอร์โทรศัพท์"
          name="shipping_address.phone"
          placeholder="099-999-9999"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />
      </div>

      <ThaiAddressSelect
        value={{
          province: formData["shipping_address.province"],
          district: formData["shipping_address.city"],
          subdistrict: formData["shipping_address.address_2"] || "",
          zipCode: formData["shipping_address.postal_code"],
        }}
        onChange={handleThaiAddressChange}
      />

      <div className="grid grid-cols-1 gap-4 my-4">
        <Input
          title="ที่อยู่"
          name="shipping_address.address_1"
          placeholder="บ้านเลขที่/ซอย/หมู่/ถนน"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
      </div>

      {/* Hidden Fields for required Medusa fields that we might not show or handle differently */}
      <input
        type="hidden"
        name="shipping_address.country_code"
        value={formData["shipping_address.country_code"]}
      />
      {/* Use a hidden input for last_name if we want to bypass required check, or we can just leave it if it's not strict.
           Ideally we'd split the name string. For this task I'll just leave first_name as the primary input.
       */}
      <input
        type="hidden"
        name="shipping_address.last_name"
        value={formData["shipping_address.last_name"] || "-"}
      />
      <input type="hidden" name="email" value={formData.email} />
    </>
  )
}

export default ShippingAddress
