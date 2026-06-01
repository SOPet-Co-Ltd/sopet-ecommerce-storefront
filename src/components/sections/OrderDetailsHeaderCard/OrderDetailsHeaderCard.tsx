"use client"
import { OrderPaymentModal } from "@/components/organisms/OrderPaymentModal/OrderPaymentModal"
import { ChangePaymentModal } from "@/components/organisms/ChangePaymentModal/ChangePaymentModal"
import { OrderCancelModal } from "@/components/molecules/OrderCancelModal/OrderCancelModal"
import { ReviewModal } from "@/components/organisms/ReviewModal/ReviewModal"
import { useState } from "react"
import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Copy, ChevronLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useReviewSubmission } from "@/hooks/useReviewSubmission"
import { toast } from "@/lib/helpers/toast"

import {
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/helpers/order-status"
import { getOrderManagementDisplayStatus } from "@/lib/helpers/order-management-status"
import {
  resolveOrderCheckoutProviderId,
  setStoredOrderPaymentProviderId,
} from "@/lib/helpers/order-checkout-payment"
import { clearOrderPromptPayContinuity } from "@/lib/helpers/order-promptpay-continuity"
import type { OrderDetails } from "@/types/order"
import { PendingPromptPayCountdownBar } from "@/components/molecules/PendingPromptPayCountdownBar/PendingPromptPayCountdownBar"
import {
  useCaptureOrderPaymentMutation,
  useCompleteOrderMutation,
} from "@/hooks/useOrderManagementQuery"
import { useOrderManagementUiStore } from "@/lib/zustand/order-management-ui-store"
import { buildThankYouPath } from "@/lib/helpers/checkout-redirect"

type OrderDetailsHeaderCardProps = {
  order: OrderDetails
  hasAnyReviewed?: boolean
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
const OrderDetailsHeaderCard = ({
  order,
  hasAnyReviewed = false,
}: OrderDetailsHeaderCardProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : "th"
  const { submitReviews } = useReviewSubmission()
  const activeModal = useOrderManagementUiStore((state) => state.activeModal)
  const openModal = useOrderManagementUiStore((state) => state.openModal)
  const closeModal = useOrderManagementUiStore((state) => state.closeModal)
  const selectedCardId = useOrderManagementUiStore(
    (state) => state.paymentFlowByOrderId[order.id]?.selectedCardId ?? null
  )
  const paymentSecretsBootstrap = useOrderManagementUiStore(
    (state) =>
      state.paymentFlowByOrderId[order.id]?.paymentSecretsBootstrap ?? null
  )
  const setSelectedCardId = useOrderManagementUiStore(
    (state) => state.setSelectedCardId
  )
  const setPaymentSecretsBootstrap = useOrderManagementUiStore(
    (state) => state.setPaymentSecretsBootstrap
  )
  const clearPaymentFlow = useOrderManagementUiStore(
    (state) => state.clearPaymentFlow
  )
  const completeOrderMutation = useCompleteOrderMutation()
  const captureOrderPaymentMutation = useCaptureOrderPaymentMutation()
  const isChangePaymentModalOpen =
    activeModal?.kind === "change-payment" && activeModal.orderId === order.id
  const isPaymentModalOpen =
    activeModal?.kind === "payment" && activeModal.orderId === order.id
  const isCancelModalOpen =
    activeModal?.kind === "cancel" && activeModal.orderId === order.id
  const isReviewModalOpen =
    activeModal?.kind === "review" && activeModal.orderId === order.id

  const handleClosePaymentModalFromQrView = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("orders_initial_tab", "to-pay")
    }
    router.push(`/${locale}/user/orders`)
    setPaymentSecretsBootstrap(order.id, null)
    closeModal()
  }

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(String(order.display_id))
    } catch (error) {
      console.error("Failed to copy order id:", error)
    }
  }

  // Determine state
  const displayStatus = getOrderManagementDisplayStatus(order)
  const statusLabel = getOrderStatusLabel(displayStatus)
  const statusColor = getOrderStatusColor(displayStatus)

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

          {isToPay && (
            <PendingPromptPayCountdownBar order={order} variant="header" />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3">
            {isToPay && (
              <div className="flex w-full items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <Button onClick={() => openModal("payment", order.id)}>
                  ชำระเงิน
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openModal("change-payment", order.id)}
                >
                  เปลี่ยนช่องทางการชำระเงิน
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openModal("cancel", order.id)}
                >
                  ยกเลิกคำสั่งซื้อ
                </Button>
              </div>
            )}

            {isToReceive && (
              <>
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const result = await completeOrderMutation.mutateAsync({
                        orderId: order.id,
                      })
                      if (result.success) {
                        closeModal()
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

            {isCompleted && !hasAnyReviewed && (
              <div className="flex gap-3 w-full md:w-auto">
                <Button onClick={() => openModal("review", order.id)}>
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
                  onClick={() => openModal("cancel", order.id)}
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
        onClose={closeModal}
        orderId={order.id}
        paymentCollectionIds={order.payment_collections
          ?.map((c) => c.id)
          .filter(Boolean)}
        orderTotal={order.total}
        currentMethod={resolveOrderCheckoutProviderId(order) ?? undefined}
        onConfirm={(cardId, providerId, bootstrap) => {
          clearOrderPromptPayContinuity(order.id)
          if (providerId) {
            setStoredOrderPaymentProviderId(order.id, providerId)
          }
          if (bootstrap?.clientSecrets?.length) {
            setPaymentSecretsBootstrap(order.id, bootstrap.clientSecrets)
          } else {
            setPaymentSecretsBootstrap(order.id, null)
          }
          if (cardId) {
            setSelectedCardId(order.id, cardId)
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`order_${order.id}_cardId`, cardId)
            }
          } else {
            setSelectedCardId(order.id, null)
            if (typeof window !== "undefined") {
              sessionStorage.removeItem(`order_${order.id}_cardId`)
            }
          }
          closeModal()
        }}
      />
      <OrderPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setPaymentSecretsBootstrap(order.id, null)
          closeModal()
        }}
        onCloseFromQrView={handleClosePaymentModalFromQrView}
        order={order}
        initialClientSecretsFromChange={paymentSecretsBootstrap}
        onConsumedInitialSecrets={() =>
          setPaymentSecretsBootstrap(order.id, null)
        }
        selectedCardId={
          selectedCardId ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem(`order_${order.id}_cardId`)
            : null)
        }
        onPaymentSuccess={async () => {
          const result = await captureOrderPaymentMutation.mutateAsync({
            orderId: order.id,
          })
          if (!result.success) {
            toast.error({
              title: "ยืนยันการชำระเงินไม่สำเร็จ",
              description: result.error ?? undefined,
            })
            throw new Error(result.error || "Capture failed")
          }
          setStoredOrderPaymentProviderId(order.id, null)
          clearOrderPromptPayContinuity(order.id)
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`order_${order.id}_cardId`)
          }
          clearPaymentFlow(order.id)
          router.replace(buildThankYouPath(locale, order.id))
        }}
      />
      <OrderCancelModal
        isOpen={isCancelModalOpen}
        onClose={closeModal}
        orderId={order.id}
        onSuccess={() => {
          setStoredOrderPaymentProviderId(order.id, null)
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`order_${order.id}_cardId`)
          }
          clearPaymentFlow(order.id)
        }}
      />
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={closeModal}
        items={order.items || []}
        onSubmit={async (reviewsData) => {
          const success = await submitReviews(reviewsData, order.id)
          if (success) {
            closeModal()
          }
        }}
      />
    </>
  )
}

export default OrderDetailsHeaderCard
