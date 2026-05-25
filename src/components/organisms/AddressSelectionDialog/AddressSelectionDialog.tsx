import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/atoms"
import { formatThaiPhoneNumberForDisplay } from "@/lib/helpers/phone"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AddressSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  addresses: HttpTypes.StoreCustomerAddress[]
  currentAddressId?: string
  onSelect: (address: HttpTypes.StoreCustomerAddress) => void
  onEdit: (address: HttpTypes.StoreCustomerAddress) => void
  onAddNew: () => void
  allowEdit?: boolean
}

export const AddressSelectionDialog = ({
  isOpen,
  onClose,
  addresses,
  currentAddressId,
  onSelect,
  onEdit,
  onAddNew,
  allowEdit = true,
}: AddressSelectionDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    currentAddressId
  )

  if (!isOpen) return null

  const handleConfirm = () => {
    const selected = addresses.find((a) => a.id === selectedId)
    if (selected) {
      onSelect(selected)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[600px] bg-white rounded-3xl p-6 md:p-8 shadow-xl max-h-[90vh] flex flex-col">
        <h2 className="md:sop-body-lg-regular sop-body-md-regular text-sop-primary-500 pb-3 border-b border-sop-neutral-grayalpha-300 mb-5">
          ที่อยู่ของฉัน
        </h2>

        <div className="flex-1 overflow-y-auto space-y-5 mb-5">
          <div className="flex flex-col gap-4">
            {addresses.map((address) => {
              const isSelected = selectedId === address.id
              return (
                <div
                  key={address.id}
                  className={cn(
                    "border border-sop-neutral-grayalpha-300 rounded-sop-12px p-2 flex flex-col gap-1"
                  )}
                  onClick={() => setSelectedId(address.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-4 md:w-5 aspect-square rounded-full border flex items-center justify-center",
                        isSelected
                          ? "border-sop-primary-500"
                          : "border-sop-neutral-grayalpha-200"
                      )}
                    >
                      {isSelected && (
                        <div className="w-1.5 md:w-2 aspect-square rounded-full bg-sop-primary-500" />
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row md:gap-4">
                      <span className="sop-body-xs-regular md:sop-body-lg-regular text-sop-base-black">
                        {address.first_name} {address.last_name}
                      </span>
                      <span className="sop-body-xs-regular md:sop-body-lg-regular text-sop-neutral-gray-400">
                        {formatThaiPhoneNumberForDisplay(address.phone)}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                      {allowEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(address)
                          }}
                          className="sop-link-xs-regular md:sop-link-md-regular text-sop-neutral-gray-400 underline cursor-pointer"
                        >
                          แก้ไข
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="sop-body-xs-regular md:sop-body-lg-regular text-sop-neutral-gray-400 leading-relaxed pl-sop-24px md:pl-sop-32px">
                    {address.address_1} {address.city} {address.address_2}{" "}
                    {address.province} {address.postal_code}
                  </p>

                  <div className="flex items-center gap-2 pl-sop-24px md:pl-sop-32px">
                    {address.is_default_shipping && (
                      <span className="sop-body-2xs-regular md:sop-body-xs-regular text-sop-secondary-500 py-1 px-3 rounded-sop-36px border border-sop-secondary-500">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <Button fill variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button fill onClick={handleConfirm} disabled={!selectedId}>
            ตกลง
          </Button>
        </div>
      </div>
    </div>
  )
}
