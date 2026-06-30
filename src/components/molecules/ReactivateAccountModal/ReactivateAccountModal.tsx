"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { formatSoftDeleteRetentionPeriodThai } from "@/lib/helpers/customer-deletion"
import { cn } from "@/lib/utils"

const retentionPeriod = formatSoftDeleteRetentionPeriodThai()

const MODAL_MESSAGE = `บัญชีของคุณอยู่ในสถานะรอลบ หากเปิดใช้งานภายใน ${retentionPeriod} ข้อมูลและประวัติการสั่งซื้อจะถูกคืนให้ตามเดิม หากยกเลิก บัญชีจะยังคงอยู่ในสถานะรอลบ`

type ReactivateAccountModalProps = {
  open: boolean
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ReactivateAccountModal({
  open,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ReactivateAccountModalProps) {
  if (!open) return null

  return (
    <Modal
      onClose={onCancel}
      header={
        <h2 className="md:sop-headline-lg-medium sop-headline-sm-medium text-[#232323] w-full text-center">
          เปิดใช้งานบัญชีอีกครั้ง
        </h2>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            fill
            size="lg"
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            fill
            size="lg"
            loading={loading}
            disabled={loading}
          >
            เปิดใช้งานบัญชี
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-sop-12px">
        <p className="md:sop-headline-sm-regular sop-body-md-regular text-[#232323] w-full text-center">
          {MODAL_MESSAGE}
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
  )
}
