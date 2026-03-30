"use client"

import { Button } from "@/components/atoms/Button/Button"
import { Modal } from "@/components/molecules/Modal/Modal"
import { Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { toast } from "@/lib/helpers/toast"
import { cancelOrder } from "@/lib/data/orders"
import { useRouter } from "next/navigation"

type OrderCancelModalProps = {
  isOpen: boolean
  onClose: () => void
  orderId: string
  onSuccess?: () => void
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "ไม่สามารถยกเลิกคำสั่งซื้อได้"
}

export const OrderCancelModal = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: OrderCancelModalProps) => {
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  if (!isOpen) {
    return null
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await cancelOrder(orderId)
      if (res?.success) {
        toast.success({
          title: "ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว",
          description: "คำสั่งซื้อของคุณถูกยกเลิกแล้ว",
        })
        onSuccess?.()
        onClose()
        router.refresh()
      } else {
        throw new Error(res?.error || "ไม่สามารถยกเลิกคำสั่งซื้อได้")
      }
    } catch (error: unknown) {
      toast.error({
        title: "เกิดข้อผิดพลาด",
        description: toErrorMessage(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      className="max-w-[400px] p-6 rounded-[12px]"
      width={400}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="text-center space-y-2">
          <Heading
            level="h2"
            className="text-sop-headline-lg-medium text-gray-900"
          >
            ยกเลิกคำสั่งซื้อ
          </Heading>
          <Text className="text-sop-body-lg-regular text-gray-900">
            คุณต้องการยกเลิกคำสั่งซื้อนี้
          </Text>
        </div>

        <div className="flex gap-4 w-full">
          <Button
            variant="outline"
            className="flex-1 rounded-full border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50 h-12 text-base font-medium"
            onClick={onClose}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            className="flex-1 rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white h-12 text-base font-medium"
            onClick={handleConfirm}
            loading={submitting}
            disabled={submitting}
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>
  )
}
