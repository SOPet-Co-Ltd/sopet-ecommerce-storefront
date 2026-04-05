"use client"

import { Button } from "@/components/atoms/Button/Button"
import { PaymentProviderIcon } from "@/components/atoms/PaymentProviderIcon/PaymentProviderIcon"
import { cn } from "@/lib/utils"
import { CreditCard, QrCode, Check } from "lucide-react"
import { useState, useEffect } from "react"
import {
  getOrderCustomerPaymentMethods,
  updateOrderPaymentSession,
} from "@/lib/data/orders"
import { toast } from "@/lib/helpers/toast"
import type { CustomerPaymentMethod } from "@/types/order"
import {
  assertOrderPaymentSessionCollectionsMatch,
  bootstrapFromOrderPaymentSessionsAligned,
  mapProviderIdToChangePaymentUiMethod,
  type OrderPaymentChangeBootstrap,
} from "@/lib/helpers/order-checkout-payment"

interface ChangePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  currentMethod?: string
  orderId: string
  /** Same order as GET /store/custom/orders/:id merged `payment_collections` (for multi-seller / shared cart). */
  paymentCollectionIds?: string[]
  orderTotal?: number
  /** Second arg is Medusa provider id; third is sessions from API so pay modal uses the same Medusa-linked secrets. */
  onConfirm?: (
    selectedCardId?: string | null,
    providerId?: string,
    bootstrap?: OrderPaymentChangeBootstrap | null
  ) => void
}

const PAYMENT_METHODS = [
  {
    id: "stripe",
    name: "Credit / Debit Card",
    icon: CreditCard,
    description: "ชำระผ่านบัตรเครดิตหรือบัตรเดบิต",
  },
  {
    id: "promptpay",
    name: "Thai QR PromptPay",
    icon: QrCode,
    description: "สแกน QR Code เพื่อชำระเงิน",
  },
]

export const ChangePaymentModal = ({
  isOpen,
  onClose,
  currentMethod,
  orderId,
  paymentCollectionIds,
  orderTotal,
  onConfirm,
}: ChangePaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>()
  const [savedMethods, setSavedMethods] = useState<CustomerPaymentMethod[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const mapped = mapProviderIdToChangePaymentUiMethod(currentMethod)
    setSelectedMethod(mapped)

    setIsLoading(true)
    getOrderCustomerPaymentMethods()
      .then((res) => {
        if (res.success) {
          setSavedMethods(res.paymentMethods)
          const defaultCard = res.paymentMethods.find((pm) => pm.is_default)
          if (defaultCard) {
            setSelectedCardId(defaultCard.id)
          } else if (res.paymentMethods.length > 0) {
            setSelectedCardId(res.paymentMethods[0]?.id ?? null)
          } else {
            setSelectedCardId(null)
          }
        }
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, currentMethod])

  const handleConfirm = async () => {
    if (!selectedMethod) return

    if (selectedMethod === "stripe" && !selectedCardId && !isLoading) {
      toast.error({
        title: "ไม่สามารถดำเนินการได้",
        description: "กรุณาเพิ่มหรือเลือกบัตรสำหรับชำระด้วยบัตร",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Map selected method to backend provider ID
      const providerId =
        selectedMethod === "stripe"
          ? "pp_card_stripe-connect"
          : "pp_promptpay_stripe-connect"

      // 1. Initialize/Update Payment Session via Server Action
      const finalAmount = orderTotal ? Math.round(orderTotal) : undefined

      const result = await updateOrderPaymentSession(
        orderId,
        providerId,
        finalAmount
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to update payment method")
      }

      if (result.order_id && result.order_id !== orderId) {
        throw new Error(
          "คำสั่งซื้อไม่ตรงกับการชำระเงิน กรุณารีเฟรชแล้วลองอีกครั้ง"
        )
      }

      assertOrderPaymentSessionCollectionsMatch(
        result.payment_collection_ids,
        paymentCollectionIds
      )

      const bootstrap = bootstrapFromOrderPaymentSessionsAligned(
        result.payment_sessions,
        paymentCollectionIds
      )

      if (
        paymentCollectionIds &&
        paymentCollectionIds.length > 0 &&
        bootstrap.clientSecrets.length !== paymentCollectionIds.length
      ) {
        throw new Error(
          "ไม่ได้รับ Payment Session ครบทุกร้าน กรุณารีเฟรชแล้วลองอีกครั้ง"
        )
      }

      toast.success({
        title: "เปลี่ยนช่องทางการชำระเงินสำเร็จ",
        description: "กรุณากดชำระเงินเพื่อดำเนินการต่อ",
      })

      onConfirm?.(
        selectedMethod === "stripe" ? selectedCardId : null,
        providerId,
        bootstrap.clientSecrets.length > 0 ? bootstrap : null
      )
      onClose()
    } catch (error: unknown) {
      toast.error({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "ไม่สามารถเปลี่ยนช่องทางการชำระเงินได้",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200 gap-6">
        <h2 className="text-xl font-bold text-gray-900 text-center">
          เปลี่ยนวิธีการชำระเงิน
        </h2>

        <div className="space-y-4">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id
            const Icon = method.icon
            return (
              <div key={method.id} className="flex flex-col gap-2">
                <div
                  className={cn(
                    "border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all",
                    isSelected
                      ? "border-sop-primary-500 bg-sop-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                      isSelected ? "border-sop-primary-500" : "border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-sop-primary-500" />
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shrink-0 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        isSelected ? "text-sop-primary-700" : "text-gray-900"
                      )}
                    >
                      {method.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.description}
                    </p>
                  </div>
                </div>

                {/* Saved Cards Section (Only for Stripe) */}
                {isSelected && method.id === "stripe" && (
                  <div className="pl-4 pr-2 py-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {isLoading ? (
                      <p className="text-sm text-gray-500 pl-4">
                        กำลังโหลดข้อมูลบัตร...
                      </p>
                    ) : savedMethods.length > 0 ? (
                      savedMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                            selectedCardId === pm.id
                              ? "border-sop-primary-500 bg-white shadow-sm"
                              : "border-transparent hover:bg-gray-50"
                          )}
                          // Note: In this implementation we just select it visually.
                          // The actual payment confirmation logic needs to handle using this saved card ID
                          // when initializing the payment intent or confirming it.
                          // For now, we just update the session provider.
                          onClick={() => setSelectedCardId(pm.id)}
                        >
                          <div className="flex items-center gap-3">
                            <PaymentProviderIcon
                              brand={pm.brand ?? null}
                              size={32}
                            />
                            <p className="text-sm font-medium text-gray-700">
                              •••• {pm.last4 ?? "****"}
                            </p>
                          </div>
                          {selectedCardId === pm.id && (
                            <Check className="w-4 h-4 text-sop-primary-500" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 pl-4">
                        ไม่มีบัตรที่บันทึกไว้
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button
            className="flex-1 rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white h-12"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={
              !selectedMethod ||
              isSubmitting ||
              (selectedMethod === "stripe" &&
                (isLoading || savedMethods.length === 0 || !selectedCardId))
            }
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </div>
  )
}
