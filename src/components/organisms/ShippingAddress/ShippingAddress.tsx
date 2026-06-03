import { HttpTypes } from "@medusajs/types"
import React, { useEffect, useMemo, useState } from "react"
import { Input, Button } from "@/components/atoms"
import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
} from "@/lib/data/thai-address-helpers"
import { usePathname } from "next/navigation"
import { AddressSelectionDialog } from "../AddressSelectionDialog/AddressSelectionDialog"
import { EditAddressDialog } from "../EditAddressDialog/EditAddressDialog"
import type { DraftShippingAddress } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"

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
    phone: normalizeThaiPhoneNumber(formData["shipping_address.phone"] ?? ""),
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
      // ที่อยู่หลัก
      "shipping_address.address_1": sourceAddress?.address_1 || "",
      // เขต/อำเภอ -> address_2
      "shipping_address.address_2": sourceAddress?.address_2 || "",
      // แขวง/ตำบล -> city
      "shipping_address.city": sourceAddress?.city || "",
      "shipping_address.postal_code": sourceAddress?.postal_code || "",
      "shipping_address.country_code": sourceAddress?.country_code || locale,
      "shipping_address.province": sourceAddress?.province || "",
      "shipping_address.phone": sourceAddress?.phone || customer?.phone || "",
      email: customer?.email || "",
    }
  })

  const provinceValue =
    (formData["shipping_address.province"] as string | undefined) || ""
  // เขต/อำเภอเก็บที่ address_2
  const districtValue =
    (formData["shipping_address.address_2"] as string | undefined) || ""

  const provinceOptions = getProvinces()
  const districtOptions = getDistricts(provinceValue)
  const subdistrictOptions = getSubdistrictsWithPostal(
    provinceValue,
    districtValue
  )

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

  const handleProvinceChange = (value: string) => {
    const next = {
      ...formData,
      "shipping_address.province": value,
      // reset เขต/อำเภอ + แขวง/ตำบล + รหัสไปรษณีย์
      "shipping_address.address_2": "",
      "shipping_address.city": "",
      "shipping_address.postal_code": "",
    }
    setFormData(next)
    if (isControlled && onDraftChange) {
      onDraftChange(formDataToDraft(next, locale))
    }
  }

  const handleDistrictChange = (value: string) => {
    const next = {
      ...formData,
      // เขต/อำเภอ -> address_2
      "shipping_address.address_2": value,
      // reset แขวง/ตำบล + รหัสไปรษณีย์
      "shipping_address.city": "",
      "shipping_address.postal_code": "",
    }
    setFormData(next)
    if (isControlled && onDraftChange) {
      onDraftChange(formDataToDraft(next, locale))
    }
  }

  const handleSubdistrictChange = (value: string) => {
    const opt = subdistrictOptions.find((o) => o.value === value)
    const postalCode = opt?.postalCode ?? ""
    const label = opt?.label ?? value

    const next = {
      ...formData,
      // แขวง/ตำบล -> city
      "shipping_address.city": label,
      "shipping_address.postal_code": postalCode,
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
            <span className="sop-body-sm-regular text-sop-neutral-gray-200">
              เลือกจากที่อยู่ที่บันทึกไว้ ({addressesInRegion?.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              className="sop-body-sm-medium"
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
        <div>
          <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
            ชื่อ-นามสกุล ผู้รับสินค้า
          </label>
          <Input
            hasTitle={false}
            name="shipping_address.first_name"
            placeholder="ชื่อ-นามสกุล"
            autoComplete="name"
            value={formData["shipping_address.first_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-first-name-input"
            className="text-sop-base-black"
          />
        </div>
        <div>
          <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
            เบอร์โทรศัพท์
          </label>
          <ThaiPhoneInput
            title={undefined}
            name="shipping_address.phone"
            placeholder="99-999-9999"
            value={formData["shipping_address.phone"]}
            onValueChange={(value) => {
              const next = { ...formData, "shipping_address.phone": value }
              setFormData(next)
              if (isControlled && onDraftChange) {
                onDraftChange(formDataToDraft(next, locale))
              }
            }}
            required
            data-testid="shipping-phone-input"
            className="text-sop-base-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SearchableSelect
          title="จังหวัด"
          placeholder="เลือกจังหวัด"
          value={provinceValue}
          onChange={handleProvinceChange}
          options={provinceOptions}
        />

        <SearchableSelect
          title="เขต/อำเภอ"
          placeholder="เลือกเขต/อำเภอ"
          value={districtValue}
          onChange={handleDistrictChange}
          options={districtOptions}
          disabled={!provinceValue}
        />

        <SearchableSelect
          title="แขวง/ตำบล"
          placeholder="เลือกแขวง/ตำบล"
          value={
            subdistrictOptions.find(
              (o) => o.label === formData["shipping_address.city"]
            )?.value ?? ""
          }
          onChange={handleSubdistrictChange}
          options={subdistrictOptions}
          disabled={!provinceValue || !districtValue}
          getDisplayLabel={(storedValue, opts) =>
            opts.find((o) => o.value === storedValue)?.label ??
            String(formData["shipping_address.city"] ?? "")
          }
        />

        <div>
          <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
            รหัสไปรษณีย์
          </label>
          <Input
            hasTitle={false}
            name="shipping_address.postal_code"
            placeholder="รหัสไปรษณีย์"
            value={formData["shipping_address.postal_code"] || ""}
            onChange={handleChange}
            className="text-sop-base-black"
            readOnly
            disabled
          />
        </div>
      </div>

      <div className="grid grid-cols-1 my-4">
        <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
          ที่อยู่
        </label>
        <Input
          hasTitle={false}
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
