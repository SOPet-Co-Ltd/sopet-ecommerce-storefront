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
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Clock, Copy, ChevronLeft, RotateCcw, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { captureOrderPayment, markOrderAsReceived } from "@/lib/data/orders"

import {
  getOrderDisplayStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/helpers/order-status"

type OrderDetailsHeaderCardProps = {
  order: any
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

  // Determine state
  const displayStatus = getOrderDisplayStatus(order)
  const statusLabel = getOrderStatusLabel(displayStatus)
  const statusColor = getOrderStatusColor(displayStatus)
  const dotColor = statusColor.replace("text-", "bg-")

  const isCancelled = displayStatus === "cancelled"
  const isToPay = displayStatus === "to-pay"
  const isPreparing = displayStatus === "preparing"
  const isToReceive = displayStatus === "to-receive"
  const isCompleted = displayStatus === "completed"

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        {/* Top Row: Title & Back */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            รายละเอียดคำสั่งซื้อ
          </h1>
          <LocalizedClientLink
            href="/user/orders"
            className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
          </LocalizedClientLink>
        </div>

        {/* Info Row */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-sm text-gray-700 mb-6 gap-4">
          <div className="flex items-center justify-start md:justify-start gap-2 w-full md:w-auto">
            <span className="text-sop-primary-500 font-medium w-[130px] shrink-0 md:w-auto md:shrink">
              หมายเลขคำสั่งซื้อ
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{order.display_id}</span>
              <button className="text-gray-400 hover:text-gray-600">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-start md:justify-start gap-2 w-full md:w-auto">
            <span className="text-sop-primary-500 font-medium w-[130px] shrink-0 md:w-auto md:shrink">
              วันที่สั่งซื้อ
            </span>
            <span className="text-gray-900">
              {formatDate(order.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-start md:justify-start gap-2 w-full md:w-auto">
            <span className="text-sop-primary-500 font-medium w-[130px] shrink-0 md:w-auto md:shrink">
              สถานะ
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 shrink-0 rounded-full bg-current ${statusColor}`}
              ></span>
              <span className={`font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Bar (Only if pending) */}
        {isToPay && (
          <div className="bg-purple-50 rounded-md p-3 mb-6 flex items-center justify-center gap-3 text-sm">
            <Clock className="w-5 h-5 text-gray-900" />
            <span className="text-gray-900">ชำระเงินผ่าน QR code ภายใน</span>
            <span className="text-red-500 font-bold text-lg">03 : 35 : 48</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-3">
          {isToPay && (
            <div className="flex w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Button
                className="h-10 min-w-fit shrink-0 rounded-full bg-sop-primary-500 px-6 text-white shadow-none hover:bg-sop-primary-600"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                ชำระเงิน
              </Button>
              <Button
                variant="outline"
                className="h-10 min-w-fit shrink-0 rounded-full border-sop-secondary-500 bg-white px-6 text-sop-secondary-500 shadow-none hover:bg-sop-secondary-50"
                onClick={() => setIsChangePaymentModalOpen(true)}
              >
                เปลี่ยนช่องทางการชำระเงิน
              </Button>
              <ActionMenu>
                <ActionMenuItem onClick={() => setIsCancelModalOpen(true)}>
                  ยกเลิกคำสั่งซื้อ
                </ActionMenuItem>
              </ActionMenu>
            </div>
          )}

          {isToReceive && (
            <>
              <Button
                className="rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white w-full md:w-auto md:min-w-[120px]"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const res = await markOrderAsReceived(order.id)
                    if (res.success) {
                      window.location.reload()
                    } else {
                      alert("Failed to complete order: " + res.error)
                    }
                  } catch (e) {
                    console.error(e)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                ฉันได้รับสินค้าแล้ว
              </Button>
            </>
          )}

          {isCompleted && (
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="rounded-full border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50 flex-1 md:flex-none md:min-w-[120px]"
                onClick={() => setIsReviewModalOpen(true)}
              >
                <Star className="w-4 h-4 mr-2" />
                ให้คะแนน
              </Button>
              <Button className="rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white flex-1 md:flex-none md:min-w-[120px]">
                <RotateCcw className="w-4 h-4 mr-2" />
                ซื้อซ้ำ
              </Button>
            </div>
          )}

          {isPreparing && (
            <div className="flex w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Button
                variant="outline"
                className="rounded-full border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 w-full md:w-auto"
                onClick={() => setIsCancelModalOpen(true)}
              >
                ยกเลิกคำสั่งซื้อ
              </Button>
            </div>
          )}

          {isCancelled && (
            <>
              <Button className="rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white w-full md:w-auto md:min-w-[120px]">
                <RotateCcw className="w-4 h-4 mr-2" />
                ซื้อซ้ำ
              </Button>
            </>
          )}
        </div>
      </div>
      <ChangePaymentModal
        isOpen={isChangePaymentModalOpen}
        onClose={() => setIsChangePaymentModalOpen(false)}
        currentMethod={order.payment_provider_id} // e.g. 'stripe' or 'promptpay'
        orderId={order.id}
        orderTotal={order.total}
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
          } catch (error) {
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
        productImage={order.items?.[0]?.thumbnail}
        productVariant={order.items?.[0]?.variant?.title}
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
