"use client"

import { useState } from "react"

import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { Modal } from "../Modal/Modal"
import { Button } from "@/components/atoms"
import { OutlineLogisIcon, TruckIcon } from "@/icons"
import { TruckElectricIcon } from "lucide-react"

type ShippingOption = {
  id: string
  name: string
  amount?: number
}

type ShippingMethodProps = {
  shippingOptions: ShippingOption[]
  selectedShippingMethodId: string
  onSelect: (id: string) => void
  onClose: () => void
}

function getEstimatedDeliveryDate(days = 5) {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })
}

const ShippingMethod = ({
  shippingOptions,
  selectedShippingMethodId,
  onSelect,
  onClose,
}: ShippingMethodProps) => {
  const [selectedId, setSelectedId] = useState(selectedShippingMethodId)

  const handleConfirm = () => {
    onSelect(selectedId)
    onClose()
  }

  return (
    <Modal
      header={
        <div className="flex">
          <h2 className="sop-body-lg-medium text-sop-neutral-gray-200">
            ตัวเลือกการจัดส่ง
          </h2>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Button onClick={onClose} variant="filled" fill size="lg">
            ยกเลิก
          </Button>

          <Button fill size="lg" onClick={handleConfirm}>
            ยืนยัน
          </Button>
        </div>
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-sop-12px h-[332px]">
        {shippingOptions.map((option) => (
          <SelectBox
            key={option.id}
            name="shipping-method"
            value={option.id}
            selectedValue={selectedId}
            onChange={setSelectedId}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex">
                <OutlineLogisIcon color="#8B91F1" size={40} />
                <div className="flex flex-col pl-sop-16px">
                  <label className="sop-body-sm-medium text-sop-neutral-gray-200">
                    {option.name}
                  </label>
                  <p className="sop-body-sm-regular text-sop-neutral-gray-300">
                    จะได้รับภายใน {getEstimatedDeliveryDate()}
                  </p>
                </div>
              </div>

              <label className="sop-body-sm-medium text-sop-additionalblue-500">
                ฿{option.amount?.toFixed(2)}
              </label>
            </div>
          </SelectBox>
        ))}
      </div>
    </Modal>
  )
}

export default ShippingMethod
