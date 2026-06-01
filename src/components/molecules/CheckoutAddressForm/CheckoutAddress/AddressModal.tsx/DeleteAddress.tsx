"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { BigWarningIcon } from "@/icons"

type DeleteAddressProps = {
  onClose: () => void
  onConfirm: () => void
}

const DeleteAddress = ({ onClose, onConfirm }: DeleteAddressProps) => {
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center my-sop-32px">
        <div className="rounded-full bg-sop-system-warning-300 p-4">
          <BigWarningIcon color="#FFFFFF" />
        </div>

        <div className="flex flex-col">
          <label className="mt-sop-20px sop-body-lg-medium text-sop-neutral-gray-200">
            ต้องการลบที่อยู่นี้?
          </label>
          <label className=" sop-body-md-regular text-sop-neutral-gray-200">
            ไม่ต้องกังวล คุณสามารถเพิ่มที่อยู่ใหม่ได้ภายหลัง?
          </label>
        </div>

        <div className="mt-6 flex w-full flex-col gap-2 md:flex-row justify-center ">
          <Button size="xl" variant="filled" onClick={onClose}>
            ยกเลิก
          </Button>

          <Button size="xl" variant="destructive" onClick={onConfirm}>
            ลบ
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteAddress
