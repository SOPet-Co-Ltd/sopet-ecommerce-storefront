"use client"
import { OrderPaymentModal } from "@/components/organisms/OrderPaymentModal/OrderPaymentModal"
import {
  ActionMenu,
  ActionMenuItem,
} from "@/components/atoms/ActionMenu/ActionMenu"
import { ChangePaymentModal } from "@/components/organisms/ChangePaymentModal/ChangePaymentModal"
import { OrderCancelModal } from "@/components/molecules/OrderCancelModal/OrderCancelModal"
import { ReviewModal } from "@/components/organisms/ReviewModal/ReviewModal"
import { useState } from "react"
import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Clock, Copy, ChevronLeft, RotateCcw, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { captureOrderPayment } from "@/lib/data/orders"

import {
  getOrderDisplayStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/helpers/order-status"
import type { OrderDetails } from "@/types/order"
import { TimeIcon } from "@/icons"

type OrderDetailsHeaderCardProps = {
  order: OrderDetails
}

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
const OrderDetailsHeaderCard = ({ order }: OrderDetailsHeaderCardProps) => {
  const [isChangePaymentModalOpen, setIsChangePaymentModalOpen] =
    useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const router = useRouter()

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(String(order.display_id))
    } catch (error) {
      console.error("Failed to copy order id:", error)
    }
  }

  // Determine state
  const displayStatus = getOrderDisplayStatus(order)
  const statusLabel = getOrderStatusLabel(displayStatus)
  const statusColor = getOrderStatusColor(displayStatus)

  const isCancelled = displayStatus === "cancelled"
  const isToPay = displayStatus === "to-pay"
  const isPreparing = displayStatus === "preparing"
  const isToReceive = displayStatus === "to-receive"
  const isCompleted = displayStatus === "completed"

  return (
    <>
      <div className="bg-sop-base-white px-4 py-3 md:px-10 md:py-10">
        {/* Top Row: Title & Back */}
        <div className="flex justify-between items-center mb-10 pb-2.5 border-b border-sop-neutral-grayalpha-300">
          <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
            รายละเอียดคำสั่งซื้อ
          </h2>
          <LocalizedClientLink href="/user/orders">
            <Button
              variant="ghost"
              rounded="rounded"
              size="sm"
              className="shadow-none"
            >
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                <p>ย้อนกลับ</p>
              </div>
            </Button>
          </LocalizedClientLink>
        </div>

        <div className="flex flex-col gap-5">
          {/* Info Row */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center justify-start gap-3">
              <p className="text-sop-primary-500 sop-body-md-medium">
                หมายเลขคำสั่งซื้อ
              </p>
              <div className="flex items-center gap-2">
                <p className="sop-body-md-regular text-sop-neutral-gray-300">
                  {order.display_id}
                </p>
                <button
                  className={`transition-colors text-gray-400 hover:text-gray-600`}
                  onClick={handleCopyOrderId}
                  title="Copy order ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-start gap-3">
              <span className="text-sop-primary-500 sop-body-md-medium">
                วันที่สั่งซื้อ
              </span>
              <span className="sop-body-md-regular text-sop-neutral-gray-300">
                {formatDate(order.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-start gap-3">
              <span className="text-sop-primary-500 sop-body-md-medium">
                สถานะ
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 shrink-0 rounded-full bg-current ${statusColor}`}
                ></span>
                <span className={`sop-body-md-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Bar (Only if pending) */}
          {isToPay && (
            <div className="flex items-center justify-between md:justify-start gap-3 bg-sop-primary-200 rounded-sop-4px p-2">
              <div className="flex items-center gap-1">
                <TimeIcon size={18} color="#000000" />
                <p className="text-sop-base-black sop-body-sm-regular md:sop-body-md-regular">
                  ชำระเงินผ่าน QR code ภายใน
                </p>
              </div>
              {/* TODO - Replace placeholder with actual countdown timer */}
              <div className="flex items-center gap-2">
                <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
                  {/* NOTE - Hours*/}
                  03
                </p>
                <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
                  :
                </p>
                <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
                  {/* NOTE - Minutes */}
                  15
                </p>
                <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
                  :
                </p>
                <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
                  {/* NOTE - Seconds */}
                  38
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3">
            {isToPay && (
              <div className="flex w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <Button onClick={() => setIsPaymentModalOpen(true)}>
                  ชำระเงิน
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsChangePaymentModalOpen(true)}
                >
                  เปลี่ยนช่องทางการชำระเงิน
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  ยกเลิกคำสั่งซื้อ
                </Button>
                {/* <ActionMenu>
                <ActionMenuItem onClick={() => setIsCancelModalOpen(true)}>
                  ยกเลิกคำสั่งซื้อ
                </ActionMenuItem>
              </ActionMenu> */}
              </div>
            )}

            {isToReceive && (
              <>
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const { completeOrder } =
                        await import("@/lib/data/orders")
                      const result = await completeOrder(order.id)
                      if (result.success) {
                        window.location.reload()
                      } else {
                        alert("Failed to complete order: " + result.error)
                      }
                    } catch (error: unknown) {
                      console.error(error)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  ได้รับสินค้าแล้ว
                </Button>
              </>
            )}

            {isCompleted && (
              <div className="flex gap-3 w-full md:w-auto">
                <Button onClick={() => setIsReviewModalOpen(true)}>
                  รีวิวสินค้า
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // TODO - Implement return flow
                    alert("ฟีเจอร์นี้กำลังพัฒนา")
                  }}
                >
                  คืนสินค้า
                </Button>
              </div>
            )}

            {isPreparing && (
              <div className="flex w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <Button
                  variant="secondary"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  ยกเลิกคำสั่งซื้อ
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* TODO - Need to check Stripe flow */}
      <ChangePaymentModal
        isOpen={isChangePaymentModalOpen}
        onClose={() => setIsChangePaymentModalOpen(false)}
        orderId={order.id}
        orderTotal={order.total}
        {...(order.payment_provider_id
          ? { currentMethod: order.payment_provider_id }
          : {})} // e.g. 'stripe' or 'promptpay'
        onConfirm={(cardId) => {
          console.log("ChangePaymentModal confirmed with cardId:", cardId)
          if (cardId) {
            setSelectedCardId(cardId)
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`order_${order.id}_cardId`, cardId)
            }
          } else {
            setSelectedCardId(null)
            if (typeof window !== "undefined") {
              sessionStorage.removeItem(`order_${order.id}_cardId`)
            }
          }
          setIsChangePaymentModalOpen(false)

          // Refresh data but don't hard reload to keep state
          router.refresh()
        }}
      />
      <OrderPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={order}
        selectedCardId={
          selectedCardId ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem(`order_${order.id}_cardId`)
            : null)
        }
        onPaymentSuccess={async () => {
          try {
            await captureOrderPayment(order.id)
            router.push(`/order/${order.id}/confirmed`)
          } catch (error: unknown) {
            console.error("Failed to capture order payment:", error)
            window.location.reload()
          }
        }}
      />
      <OrderCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        orderId={order.id}
      />
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productName={order.items?.[0]?.title || "สินค้า"}
        productImage={order.items?.[0]?.thumbnail ?? null}
        {...(order.items?.[0]?.variant?.title
          ? { productVariant: order.items[0].variant.title }
          : {})}
        productPrice={
          order.items?.[0]
            ? `${(order.items[0].unit_price / 100).toFixed(2)}`
            : ""
        } // Simple fallback formatting or use helper if imported
        onSubmit={async (data) => {
          console.log("Submitting review:", data)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          alert("ขอบคุณสำหรับการรีวิว!")
        }}
      />
    </>
  )
}

export default OrderDetailsHeaderCard
