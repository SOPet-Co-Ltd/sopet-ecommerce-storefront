"use client"
import { Button } from "@/components/atoms"
import { AddressForm } from "@/components/molecules/AddressForm/AddressForm"
import { Modal } from "@/components/molecules"
import type { AddressFormData } from "@/components/molecules/AddressForm/schema"
import { PlusIcon } from "@/icons"
import { deleteCustomerAddress } from "@/lib/data/customer"
import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import { isEmpty } from "lodash"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export const Addresses = ({
  user,
  regions,
}: {
  user: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}) => {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""
  const [deleteAddress, setDeleteAddress] = useState<string | null>(null)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)

  const addresses = user.addresses ?? []

  // Sort addresses: default first, then by creation date (or ID as fallback)
  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => {
      const aIsDefault = !!(a as { is_default_shipping?: boolean })
        .is_default_shipping
      const bIsDefault = !!(b as { is_default_shipping?: boolean })
        .is_default_shipping

      // Default addresses first
      if (aIsDefault !== bIsDefault) {
        return aIsDefault ? -1 : 1
      }

      // Then sort by creation date or ID
      const aCreated = (a as { created_at?: string }).created_at || a.id
      const bCreated = (b as { created_at?: string }).created_at || b.id
      return aCreated.localeCompare(bCreated)
    })
  }, [addresses])

  const editingAddress =
    editingAddressId != null
      ? addresses.find((a) => a.id === editingAddressId)
      : null

  const goToNewAddress = () => router.push(`/${locale}/user/addresses/new`)

  const editDefaultValues: AddressFormData | null =
    editingAddress != null
      ? {
          addressId: editingAddress.id,
          recipientFullName: [
            editingAddress.first_name,
            editingAddress.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),
          phone: editingAddress.phone || user.phone || "",
          province: editingAddress.province || "",
          district: editingAddress.address_2 || "",
          subDistrict: editingAddress.city || "",
          postalCode: editingAddress.postal_code || "",
          address: editingAddress.address_1 || "",
          setAsDefault: !!(editingAddress as { is_default_shipping?: boolean })
            .is_default_shipping,
        }
      : null

  const handleDelete = async (addressId: string) => {
    await deleteCustomerAddress(addressId)
    setDeleteAddress(null)
  }

  const formatAddressLine = (address: (typeof addresses)[0]) => {
    const parts = [
      address.address_1,
      address.city,
      address.address_2,
      address.province,
      address.postal_code,
    ].filter(Boolean)
    return parts.join(" ")
  }

  return (
    <>
      {isEmpty(sortedAddresses) ? (
        <div className="text-center pt-8">
          <p className="sop-body-md-regular text-sop-neutral-gray-300">
            คุณยังไม่มีที่อยู่จัดส่งที่บันทึกไว้ <br />
            เพิ่มที่อยู่เพื่อให้การสั่งซื้อสะดวกขึ้น
          </p>
        </div>
      ) : (
        <>
          {sortedAddresses.map((address) => {
            const isDefault = !!(address as { is_default_shipping?: boolean })
              .is_default_shipping
            const contactName = [address.first_name, address.last_name]
              .filter(Boolean)
              .join(" ")
            const phone = address.phone || user.phone || ""
            return (
              <div
                key={address.id}
                className="flex flex-col items-start pb-sop-20px mb-sop-20px gap-2 border-b border-sop-neutral-grayalpha-300 relative"
              >
                <div className="flex flex-col md:flex-row md:gap-2">
                  <span className="sop-body-md-regular md:sop-headline-sm-regular text-sop-base-black">
                    {contactName}
                  </span>
                  <span className="sop-body-md-regular md:sop-headline-sm-regular text-sop-neutral-gray-300">
                    {phone}
                  </span>
                </div>
                <div>
                  <span className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
                    {formatAddressLine(address)}
                  </span>
                </div>
                {isDefault && (
                  <div>
                    <span className="sop-body-xs-regular md:sop-body-md-regular text-sop-secondary-500">
                      ค่าเริ่มต้น
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 shrink-0 absolute right-0">
                  <button
                    type="button"
                    onClick={() => setEditingAddressId(address.id)}
                    className="sop-link-md-regular text-sop-additionalblue-500"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAddress(address.id)}
                    className="sop-link-md-regular text-sop-additionalblue-500"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
      {sortedAddresses.length < 6 && (
        <div className="flex justify-center pt-6">
          <Button
            type="button"
            onClick={goToNewAddress}
            variant="secondary"
            rounded="rounded"
            size="md"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} color="currentColor" />
              เพิ่มที่อยู่
            </div>
          </Button>
        </div>
      )}
      {deleteAddress && (
        <Modal
          onClose={() => setDeleteAddress(null)}
          header={
            <h2 className="md:sop-headline-lg-medium sop-headline-sm-medium text-[#232323] w-full text-center">
              ยืนยันการลบ
            </h2>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setDeleteAddress(null)}
                variant="outline"
                fill
                size="lg"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => handleDelete(deleteAddress)}
                fill
                size="lg"
              >
                ลบ
              </Button>
            </div>
          }
        >
          <p className="md:sop-headline-sm-regular sop-body-md-regular text-[#232323] w-full text-center">
            คุณต้องการลบที่อยู่นี้
          </p>
        </Modal>
      )}
      {editingAddressId != null && editDefaultValues != null && (
        <Modal
          onClose={() => setEditingAddressId(null)}
          header={
            <div className="border-b border-sop-neutral-grayalpha-300 pb-3">
              <h2 className="sop-body-lg-regular text-sop-primary-500">
                แก้ไขที่อยู่
              </h2>
            </div>
          }
        >
          <AddressForm
            key={editingAddressId}
            mode="edit"
            regions={regions}
            defaultValues={editDefaultValues}
            handleClose={() => {
              setEditingAddressId(null)
              router.refresh()
            }}
            submitButton={({ onSubmit, isSubmitting }) => (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingAddressId(null)
                    router.refresh()
                  }}
                  variant="secondary"
                  fill
                >
                  ยกเลิก
                </Button>
                <Button onClick={onSubmit} disabled={isSubmitting} fill>
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            )}
          />
        </Modal>
      )}
    </>
  )
}
