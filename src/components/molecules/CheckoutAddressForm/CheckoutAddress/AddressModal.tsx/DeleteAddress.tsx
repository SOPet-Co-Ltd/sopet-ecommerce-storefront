"use client"

import { useState } from "react"
import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { BigWarningIcon } from "@/icons"

type DeleteAddressProps = {
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

const DeleteAddress = ({ onClose, onConfirm }: DeleteAddressProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal onClose={onClose} aria-labelledby="delete-address-title">
      <div className="flex flex-col items-center text-center my-sop-32px">
        <div className="rounded-full bg-sop-system-warning-300 p-4">
          <BigWarningIcon color="#FFFFFF" aria-hidden="true" />
        </div>

        <div className="flex flex-col">
          <label
            id="delete-address-title"
            className="mt-sop-20px sop-body-lg-medium text-sop-neutral-gray-200"
          >
            ต้องการลบที่อยู่นี้?
          </label>
          <label className=" sop-body-md-regular text-sop-neutral-gray-200">
            ไม่ต้องกังวล คุณสามารถเพิ่มที่อยู่ใหม่ได้ภายหลัง
          </label>
        </div>

        <div className="mt-6 flex w-full flex-col gap-2 md:flex-row justify-center ">
          <Button
            type="button"
            size="xl"
            variant="filled"
            onClick={onClose}
            disabled={isDeleting}
          >
            ยกเลิก
          </Button>

          <Button
            type="button"
            size="xl"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
            aria-label={
              isDeleting
                ? "กำลังลบที่อยู่ กรุณารอสักครู่"
                : "ยืนยันการลบที่อยู่"
            }
          >
            {isDeleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </div>

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isDeleting && "กำลังลบที่อยู่ กรุณารอสักครู่"}
        </div>
      </div>
    </Modal>
  )
}

export default DeleteAddress
