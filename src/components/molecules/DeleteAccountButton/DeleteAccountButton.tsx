"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { requestDeleteAccount } from "@/lib/data/customer"
import { formatSoftDeleteRetentionPeriodThai } from "@/lib/helpers/customer-deletion"
import { useState } from "react"
import { cn } from "@/lib/utils"

const retentionPeriod = formatSoftDeleteRetentionPeriodThai()

const MODAL_CONFIRM_MESSAGE = `บัญชีจะเข้าสู่สถานะรอลบ คุณสามารถเปิดใช้งานบัญชีอีกครั้งได้ภายใน ${retentionPeriod} โดยเข้าสู่ระบบใหม่ หลังจากนั้นบัญชีจะถูกปิดใช้งานถาวร`

export function DeleteAccountButton() {
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = () => {
    setError(null)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    if (!loading) setOpenModal(false)
  }

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await requestDeleteAccount()
      if (!result.success) {
        setError(result.error)
      }
      // On success, requestDeleteAccount redirects
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-sop-16px">
      <Button
        className="min-w-[150px]"
        rounded="rounded"
        size="md"
        type="button"
        variant="destructive"
        onClick={handleOpenModal}
      >
        ลบบัญชี
      </Button>
      {error && (
        <p
          className={cn(
            "sop-body-sm-regular text-sop-system-error-400 text-center"
          )}
          role="alert"
        >
          {error}
        </p>
      )}

      {openModal && (
        <Modal
          onClose={handleCloseModal}
          header={
            <h2 className="md:sop-headline-lg-medium sop-headline-sm-medium text-[#232323] w-full text-center">
              ยืนยันการลบบัญชี
            </h2>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCloseModal}
                variant="outline"
                fill
                size="lg"
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirm}
                variant="destructive"
                fill
                size="lg"
                loading={loading}
                disabled={loading}
              >
                ลบบัญชี
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-sop-12px">
            <p className="md:sop-headline-sm-regular sop-body-md-regular text-[#232323] w-full text-center">
              {MODAL_CONFIRM_MESSAGE}
            </p>
            {error && (
              <p
                className={cn(
                  "sop-body-sm-regular text-sop-system-error-400 text-center"
                )}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
