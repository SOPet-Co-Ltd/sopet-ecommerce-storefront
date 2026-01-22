import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/atoms"
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
        <h2 className="text-xl font-bold text-sop-primary-600 mb-6">
          ที่อยู่ของฉัน
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="flex flex-col gap-4">
            {addresses.map((address) => {
              const isSelected = selectedId === address.id
              return (
                <div
                  key={address.id}
                  className={cn(
                    "border rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer bg-sop-base-white",
                    isSelected
                      ? "border-sop-neutral-grayfixed-400 "
                      : "border-sop-neutral-grayfixed-200 hover:border-sop-neutral-grayfixed-400"
                  )}
                  onClick={() => setSelectedId(address.id)}
                >
                  <div
                    className={cn(
                      "mt-1 w-5 h-5 min-w-sop-20px rounded-full border  flex items-center justify-center",
                      isSelected
                        ? "border-sop-primary-600"
                        : "border-sop-neutral-grayfixed-300"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-sop-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-4 items-center flex-wrap">
                        <span className="font-bold text-sop-neutral-grayfixed-100 cursor-pointer">
                          {address.first_name} {/* {address.last_name} */}
                        </span>
                        <span className="text-sop-neutral-grayfixed-400">
                          {address.phone}
                        </span>
                        {address.is_default_shipping && (
                          <span className="px-2 py-0.5 border border-sop-secondary-500 text-sop-secondary-500 text-xs rounded-full bg-white">
                            ค่าเริ่มต้น
                          </span>
                        )}
                      </div>
                      {allowEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(address)
                          }}
                          className="text-sop-neutral-grayfixed-400 underline hover:text-sop-neutral-grayfixed-100 text-sm"
                        >
                          แก้ไข
                        </button>
                      )}
                    </div>
                    <p className="text-sop-neutral-grayfixed-400 text-sm leading-relaxed">
                      {address.address_1} {address.address_2}{" "}
                      {address.city ? `แขวง${address.city}` : ""}{" "}
                      {address.province ? `เขต${address.province}` : ""}{" "}
                      {address.province} {address.postal_code}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            variant="secondary"
            className="w-full rounded-full bg-sop-base-white border-sop-primary-600 text-sop-primary-600 hover:bg-sop-primary-100"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            className="w-full rounded-full bg-sop-primary-600 hover:bg-sop-primary-700 text-white"
            onClick={handleConfirm}
            disabled={!selectedId}
          >
            ตกลง
          </Button>
        </div>
      </div>
    </div>
  )
}
