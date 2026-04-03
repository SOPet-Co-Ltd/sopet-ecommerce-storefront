import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/atoms"
import { useState } from "react"
import { deleteCustomerAddress } from "@/lib/data/customer"
import { useRouter } from "next/navigation"
import {
  AddressForm,
  emptyDefaultAddressValues,
} from "@/components/molecules/AddressForm/AddressForm"

interface EditAddressDialogProps {
  isOpen: boolean
  onClose: () => void
  address: HttpTypes.StoreCustomerAddress | null // null = new address
  onSuccess: () => void
}

export const EditAddressDialog = ({
  isOpen,
  onClose,
  address,
  onSuccess,
}: EditAddressDialogProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDelete = async () => {
    if (!address) return
    if (!confirm("Are you sure you want to delete this address?")) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteCustomerAddress(address.id)
      onSuccess()
      onClose()
      router.refresh()
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  const defaultValues = (() => {
    if (!address) {
      return emptyDefaultAddressValues
    }

    const recipientFullName = [address.first_name, address.last_name]
      .filter(Boolean)
      .join(" ")

    return {
      ...emptyDefaultAddressValues,
      recipientFullName,
      phone: address.phone || "",
      province: address.province || "",
      district: address.address_2 || "",
      subDistrict: address.city || "",
      postalCode: address.postal_code || "",
      address: address.address_1 || "",
      setAsDefault: !!address.is_default_shipping,
    }
  })()

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[600px] bg-white rounded-3xl p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="md:sop-body-lg-regular sop-body-md-regular text-sop-primary-500 pb-3 border-b border-sop-neutral-grayalpha-300 mb-5">
          {address ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
        </h2>

        <div className="space-y-6">
          <AddressForm
            mode={address ? "edit" : "create"}
            defaultValues={defaultValues}
            regions={[]}
            handleClose={() => {
              onSuccess()
              onClose()
              router.refresh()
            }}
            submitButton={({
              onSubmit,
              isSubmitting,
              isDirty,
              hasAnyValue,
            }) => {
              return (
                <div className="flex flex-col gap-sop-12px">
                  {deleteError && (
                    <p className="text-sop-system-error-400 sop-body-xs-regular">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {address && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        fill
                      >
                        ลบที่อยู่นี้
                      </Button>
                    )}
                    <Button
                      onClick={onSubmit}
                      disabled={
                        isSubmitting ||
                        !hasAnyValue ||
                        (address ? !isDirty : false)
                      }
                      fill
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "ยืนยัน"}
                    </Button>
                  </div>
                </div>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
