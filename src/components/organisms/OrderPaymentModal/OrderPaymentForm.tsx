"use client"

import { Button } from "@/components/atoms/Button/Button"
import { X, CreditCard } from "lucide-react"
import { useState } from "react"
import type { OrderDetails } from "@/types/order"

interface OrderPaymentFormProps {
  order: OrderDetails
  onClose: () => void
  onPaymentSuccess?: () => void | Promise<void>
  selectedCardId?: string | null
  clientSecrets: string[]
}

export const OrderPaymentForm = ({
  order,
  onClose,
  onPaymentSuccess,
  selectedCardId,
  clientSecrets: _clientSecrets,
}: OrderPaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      if (!selectedCardId) {
        throw new Error("กรุณาเลือกบัตรที่บันทึกไว้")
      }

      if (onPaymentSuccess) {
        await onPaymentSuccess()
      }
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการชำระเงิน"
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-sop-primary-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <CreditCard
              className="w-5 h-5 text-sop-primary-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2
              id="payment-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              ชำระเงิน
            </h2>
            <p className="text-sm text-gray-500">
              คำสั่งซื้อ #{order.display_id}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="ปิดหน้าต่างชำระเงิน"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">ยอดที่ต้องชำระ</span>
          <span className="text-2xl font-bold text-sop-primary-500">
            ฿{order.total.toFixed(2)}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 flex flex-col items-center"
        noValidate
        aria-labelledby="payment-modal-title"
      >
        <div className="w-full">
          {selectedCardId ? (
            <div className="bg-white border border-sop-primary-500 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <CreditCard
                  className="w-6 h-6 text-sop-primary-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    ชำระด้วยบัตรที่บันทึกไว้
                  </p>
                  <p className="text-sm text-gray-500">
                    กรุณากดชำระเงินเพื่อดำเนินการต่อ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex text-center items-center justify-center"
              role="alert"
            >
              <p className="font-medium text-red-600">
                ไม่พบบัตรที่บันทึกไว้ กรุณายกเลิกและเลือกช่องทางชำระเงินใหม่
              </p>
            </div>
          )}
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-3 w-full"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="ยกเลิกการชำระเงิน"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            className="w-full rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white"
            disabled={!selectedCardId || isProcessing}
            aria-busy={isProcessing}
            aria-label={
              isProcessing
                ? "กำลังดำเนินการชำระเงิน กรุณารอสักครู่"
                : "ชำระเงิน"
            }
          >
            {isProcessing ? "กำลังดำเนินการ..." : "ชำระเงิน"}
          </Button>
        </div>
      </form>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing && "กำลังดำเนินการชำระเงิน กรุณารอสักครู่"}
      </div>
    </div>
  )
}
