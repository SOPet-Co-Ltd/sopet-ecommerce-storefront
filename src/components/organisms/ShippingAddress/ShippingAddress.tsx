import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import { Input, Checkbox, Button } from "@/components/atoms"
import ThaiAddressSelect, {
  ThaiAddressValue,
} from "@/components/cells/ThaiAddressSelect/ThaiAddressSelect"
import { usePathname } from "next/navigation"
import { Cart } from "@/types/cart"
import { AddressSelectionDialog } from "../AddressSelectionDialog/AddressSelectionDialog"
import { EditAddressDialog } from "../EditAddressDialog/EditAddressDialog"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  prefilledPhone,
  showSaveAddress,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: Cart | null
  checked: boolean
  onChange: () => void
  prefilledPhone?: string
  showSaveAddress?: boolean
}) => {
  const pathname = usePathname()

  let locale = pathname.split("/")[1]
  if (!locale || locale.length !== 2) {
    locale = "th"
  }
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || locale,
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  // Dialog States
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean
    address: HttpTypes.StoreCustomerAddress | null
  }>({
    isOpen: false,
    address: null,
  })

  const [shouldSaveAddress, setShouldSaveAddress] = useState(true)

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && a.country_code === locale
      ),
    [customer?.addresses, locale]
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
  }, [cart, prefilledPhone, customer?.email])

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
      "shipping_address.city": value.district,
      "shipping_address.address_2": value.subdistrict,
      "shipping_address.postal_code": value.zipCode,
    }))
  }

  return (
    <>
      <AddressSelectionDialog
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        addresses={addressesInRegion || []}
        currentAddressId={undefined} // Could match based on content if needed
        onSelect={(addr) => {
          setFormAddress(addr as unknown as HttpTypes.StoreCartAddress)
          setIsSelectionOpen(false)
        }}
        onEdit={(addr) => {
          setIsSelectionOpen(false)
          setEditDialogState({ isOpen: true, address: addr })
        }}
        onAddNew={() => {
          setIsSelectionOpen(false)
          setEditDialogState({ isOpen: true, address: null })
        }}
      />

      <EditAddressDialog
        isOpen={editDialogState.isOpen}
        onClose={() =>
          setEditDialogState({ ...editDialogState, isOpen: false })
        }
        address={editDialogState.address}
        onSuccess={() => {
          // Address updated logic handled by dialog (refresh)
          // Optionally re-open selection dialog?
          setIsSelectionOpen(true)
        }}
      />

      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">
              เลือกจากที่อยู่ที่บันทึกไว้ ({addressesInRegion?.length})
            </span>
            <Button
              variant="secondary"
              className="text-purple-600 border-purple-600 hover:bg-purple-50 h-8 text-sm"
              onClick={() => setIsSelectionOpen(true)}
              type="button"
            >
              เลือกที่อยู่
            </Button>
          </div>
        </div>
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

      {/* Hidden Fields for required Medusa fields */}
      <input
        type="hidden"
        name="shipping_address.country_code"
        value={formData["shipping_address.country_code"]}
      />
      <input
        type="hidden"
        name="shipping_address.province"
        value={formData["shipping_address.province"] || ""}
      />
      <input
        type="hidden"
        name="shipping_address.city"
        value={formData["shipping_address.city"] || ""}
      />
      <input
        type="hidden"
        name="shipping_address.postal_code"
        value={formData["shipping_address.postal_code"] || ""}
      />
      <input
        type="hidden"
        name="shipping_address.address_2"
        value={formData["shipping_address.address_2"] || ""}
      />
      <input
        type="hidden"
        name="shipping_address.last_name"
        value={formData["shipping_address.last_name"] || "-"}
      />
      {customer?.email && (
        <input type="hidden" name="email" value={customer.email} />
      )}
    </>
  )
}

export default ShippingAddress
