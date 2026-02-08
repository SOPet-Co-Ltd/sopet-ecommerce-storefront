import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import { Input, Checkbox, Button } from "@/components/atoms"
import ThaiAddressSelect, {
  ThaiAddressValue,
} from "@/components/cells/ThaiAddressSelect/ThaiAddressSelect"
import { usePathname } from "next/navigation"
import { AddressSelectionDialog } from "../AddressSelectionDialog/AddressSelectionDialog"
import { EditAddressDialog } from "../EditAddressDialog/EditAddressDialog"
import type { DraftShippingAddress } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"

/** Split full name into first segment and rest; last_name is "" if only one segment. */
function splitFullName(fullName: string): {
  first_name: string
  last_name: string
} {
  const trimmed = (fullName ?? "").trim()
  if (!trimmed) return { first_name: "", last_name: "" }
  const parts = trimmed.split(/\s+/)
  const first_name = parts[0] ?? ""
  const last_name = parts.slice(1).join(" ").trim() ?? ""
  return { first_name, last_name }
}

function formDataToDraft(
  formData: Record<string, any>,
  countryCode = "th"
): DraftShippingAddress {
  const fullName = formData["shipping_address.first_name"] ?? ""
  const { first_name, last_name } = splitFullName(fullName)
  return {
    first_name,
    last_name,
    address_1: formData["shipping_address.address_1"] ?? "",
    address_2: formData["shipping_address.address_2"] ?? "",
    city: formData["shipping_address.city"] ?? "",
    province: formData["shipping_address.province"] ?? "",
    postal_code: formData["shipping_address.postal_code"] ?? "",
    country_code: formData["shipping_address.country_code"] ?? countryCode,
    phone: formData["shipping_address.phone"] ?? "",
  }
}

function draftToFormData(
  draft: DraftShippingAddress,
  email = ""
): Record<string, any> {
  const fullNameDisplay = [draft.first_name, draft.last_name]
    .filter(Boolean)
    .join(" ")
  return {
    "shipping_address.first_name": fullNameDisplay,
    "shipping_address.last_name": draft.last_name ?? "",
    "shipping_address.address_1": draft.address_1,
    "shipping_address.address_2": draft.address_2,
    "shipping_address.city": draft.city,
    "shipping_address.province": draft.province,
    "shipping_address.postal_code": draft.postal_code,
    "shipping_address.country_code": draft.country_code || "th",
    "shipping_address.phone": draft.phone,
    email,
  }
}

const ShippingAddress = ({
  customer,
  checked,
  onChange,
  prefilledPhone,
  showSaveAddress,
  controlledDraft,
  onDraftChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  checked: boolean
  onChange: () => void
  prefilledPhone?: string
  showSaveAddress?: boolean
  /** When provided, form is controlled by checkout context (draft only; no save until proceed). */
  controlledDraft?: DraftShippingAddress
  onDraftChange?: (draft: DraftShippingAddress) => void
}) => {
  const pathname = usePathname()
  const isControlled = controlledDraft != null && onDraftChange != null

  let locale = pathname.split("/")[1]
  if (!locale || locale.length !== 2) {
    locale = "th"
  }
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (isControlled && controlledDraft) {
      return draftToFormData(controlledDraft, customer?.email ?? "")
    }
    let sourceAddress: HttpTypes.StoreCustomerAddress | undefined

    if (customer?.addresses?.length) {
      sourceAddress =
        customer.addresses.find((a) => a.is_default_shipping) ||
        customer.addresses[0]
    }

    return {
      "shipping_address.first_name": sourceAddress?.first_name || "",
      "shipping_address.last_name": sourceAddress?.last_name || "",
      "shipping_address.address_1": sourceAddress?.address_1 || "",
      "shipping_address.postal_code": sourceAddress?.postal_code || "",
      "shipping_address.city": sourceAddress?.city || "",
      "shipping_address.country_code": sourceAddress?.country_code || locale,
      "shipping_address.province": sourceAddress?.province || "",
      "shipping_address.phone": sourceAddress?.phone || customer?.phone || "",
      email: customer?.email || "",
    }
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

  const addressesInRegion = useMemo(() => {
    const allAddresses = customer?.addresses || []
    if (!allAddresses.length) {
      return []
    }
    const inRegion = allAddresses.filter(
      (a) => a.country_code && a.country_code === locale
    )
    return inRegion.length ? inRegion : allAddresses
  }, [customer?.addresses, locale])

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
    if (isControlled && controlledDraft) {
      setFormData(draftToFormData(controlledDraft, customer?.email ?? ""))
    }
  }, [
    isControlled,
    controlledDraft?.first_name,
    controlledDraft?.last_name,
    controlledDraft?.address_1,
    controlledDraft?.address_2,
    controlledDraft?.city,
    controlledDraft?.province,
    controlledDraft?.postal_code,
    controlledDraft?.country_code,
    controlledDraft?.phone,
    customer?.email,
  ])

  useEffect(() => {
    if (customer?.email && !isControlled) {
      setFormAddress(undefined, customer.email)
    }
    if (prefilledPhone) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.phone": prefilledPhone,
      }))
    }
  }, [prefilledPhone, customer?.email, isControlled])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const next = { ...formData, [e.target.name]: e.target.value }
    setFormData(next)
    if (isControlled && onDraftChange) {
      onDraftChange(formDataToDraft(next, locale))
    }
  }

  const handleThaiAddressChange = (value: ThaiAddressValue) => {
    const next = {
      ...formData,
      "shipping_address.province": value.province,
      "shipping_address.city": value.district,
      "shipping_address.address_2": value.subdistrict,
      "shipping_address.postal_code": value.zipCode,
    }
    setFormData(next)
    if (isControlled && onDraftChange) {
      onDraftChange(formDataToDraft(next, locale))
    }
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
          setIsSelectionOpen(true)
        }}
      />

      {!isControlled && customer && (addressesInRegion?.length || 0) > 0 && (
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
          className="text-sop-base-black"
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
          className="text-sop-base-black"
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
          className="text-sop-base-black"
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
        value={formData["shipping_address.last_name"] ?? ""}
      />
      {customer && <input type="hidden" name="email" value={formData.email} />}
    </>
  )
}

export default ShippingAddress
