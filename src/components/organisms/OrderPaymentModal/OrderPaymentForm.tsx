"use client"

import { Button } from "@/components/atoms/Button/Button"
import { useStripe } from "@stripe/react-stripe-js"
import { X, CreditCard } from "lucide-react"
import { useState } from "react"
import type { OrderDetails } from "@/types/order"

interface OrderPaymentFormProps {
  order: OrderDetails
  onClose: () => void
  onPaymentSuccess?: () => void | Promise<void>
  selectedCardId?: string | null
  /** One secret (single seller) or one per marketplace payment collection (multi-seller). */
  clientSecrets: string[]
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "เกิดข้อผิดพลาดในการชำระเงิน"
}

export const OrderPaymentForm = ({
  order,
  onClose,
  onPaymentSuccess,
  selectedCardId,
  clientSecrets,
}: OrderPaymentFormProps) => {
  const stripe = useStripe()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      if (!clientSecrets.length) {
        throw new Error("ไม่พบข้อมูล Payment Session")
      }

      if (!selectedCardId) {
        throw new Error("กรุณาเลือกบัตรที่บันทึกไว้")
      }

      for (const secret of clientSecrets) {
        const confirmResult = await stripe.confirmCardPayment(secret, {
          payment_method: selectedCardId,
        })

        const stripeError = confirmResult.error
        const paymentIntent = confirmResult.paymentIntent

        if (stripeError) {
          throw new Error(stripeError.message)
        }

        if (
          paymentIntent?.status !== "succeeded" &&
          paymentIntent?.status !== "processing" &&
          paymentIntent?.status !== "requires_action"
        ) {
          throw new Error(
            paymentIntent?.status
              ? `สถานะการชำระเงินไม่คาดหมาย: ${paymentIntent.status}`
              : "การชำระเงินไม่สำเร็จ"
          )
        }
      }

      if (onPaymentSuccess) {
        await onPaymentSuccess()
      }
      onClose()
    } catch (error: unknown) {
      setError(toErrorMessage(error))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sop-primary-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-sop-primary-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ชำระเงิน</h2>
            <p className="text-sm text-gray-500">
              คำสั่งซื้อ #{order.display_id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">ยอดที่ต้องชำระ</span>
          <span className="text-2xl font-bold text-sop-primary-500">
            ฿{order.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Form OR Saved Card Summary */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 flex flex-col items-center"
      >
        <div className="w-full">
          {selectedCardId ? (
            <div className="bg-white border border-sop-primary-500 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-sop-primary-500" />
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex text-center items-center justify-center">
              <p className="font-medium text-red-600">
                ไม่พบบัตรที่บันทึกไว้ กรุณายกเลิกและเลือกช่องทางชำระเงินใหม่
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
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
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            className="w-full rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white"
            disabled={!stripe || !selectedCardId || isProcessing}
          >
            {isProcessing ? "กำลังดำเนินการ..." : "ชำระเงิน"}
          </Button>
        </div>
      </form>
    </div>
  )
}
