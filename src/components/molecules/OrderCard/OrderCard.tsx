"use client"

import { clx } from "@medusajs/ui"

import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { OrderPaymentModal } from "@/components/organisms/OrderPaymentModal/OrderPaymentModal"
import { OrderCancelModal } from "@/components/molecules/OrderCancelModal/OrderCancelModal"
import { ChangePaymentModal } from "@/components/organisms/ChangePaymentModal/ChangePaymentModal"
import { convertToLocale } from "@/lib/helpers/money"
import { toast } from "@/lib/helpers/toast"
import { useReviewSubmission } from "@/hooks/useReviewSubmission"
import {
  ActionMenu,
  ActionMenuItem,
} from "@/components/atoms/ActionMenu/ActionMenu"
import { ReviewModal } from "@/components/organisms/ReviewModal/ReviewModal"
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"

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
import { SmartImage } from "@/components/atoms"
import { PendingPromptPayCountdownBar } from "@/components/molecules/PendingPromptPayCountdownBar/PendingPromptPayCountdownBar"
import {
  useCaptureOrderPaymentMutation,
  useCompleteOrderMutation,
} from "@/hooks/useOrderManagementQuery"
import { useOrderManagementUiStore } from "@/lib/zustand/order-management-ui-store"
import { buildThankYouPath } from "@/lib/helpers/checkout-redirect"

type OrderCardProps = {
  order: OrderDetails
  hasAnyReviewed?: boolean
}

const OrderCard = ({ order, hasAnyReviewed = false }: OrderCardProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : "th"
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
  const isPaymentModalOpen =
    activeModal?.kind === "payment" && activeModal.orderId === order.id
  const isCancelModalOpen =
    activeModal?.kind === "cancel" && activeModal.orderId === order.id
  const isChangePaymentModalOpen =
    activeModal?.kind === "change-payment" && activeModal.orderId === order.id
  const isReviewModalOpen =
    activeModal?.kind === "review" && activeModal.orderId === order.id

  const displayStatus = useMemo(() => {
    return (
      (order as any).slice_display_status ||
      getOrderManagementDisplayStatus(order)
    )
  }, [order])

  const statusLabel = useMemo(
    () => getOrderStatusLabel(displayStatus),
    [displayStatus]
  )
  const statusColor = useMemo(
    () => getOrderStatusColor(displayStatus),
    [displayStatus]
  )

  const { submitReviews } = useReviewSubmission()

  const calculatedTotal = useMemo(() => {
    return Number(order.total) || 0
  }, [order.total])

  const sellerName =
    (order as any).seller_name ||
    order.store?.name ||
    order.seller?.name ||
    "ร้านค้าไม่ระบุ"

  return (
    <>
      <div className="bg-sop-base-white flex flex-col gap-2.5 md:gap-sop-20px px-sop-16px py-sop-20px w-full">
        <div className="flex flex-col gap-2.5 md:gap-5">
          {/* Header */}
          <div className="border-b border-sop-neutral-grayalpha-300 pb-sop-12px flex items-center justify-between w-full">
            <p className="font-medium text-lg text-[#211f23]">{sellerName}</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={clx(
                    "w-2.5 h-2.5 shrink-0 rounded-full bg-current",
                    statusColor
                  )}
                ></span>
                <span
                  className={clx(
                    "sop-body-sm-regular md:sop-body-md-medium",
                    statusColor
                  )}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Product Section */}
          <div className="flex flex-col gap-2.5 md:gap-5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-2 md:gap-4 items-center w-full border-b border-sop-neutral-grayalpha-300 last:border-0 pb-3 md:pb-5"
              >
                {/* Image */}
                <div className="relative w-20 h-20 shrink-0 overflow-hidden">
                  {item?.thumbnail ? (
                    <SmartImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 w-full">
                  <div>
                    <p className="text-sop-neutral-gray-300 sop-body-xs-medium md:sop-body-md-medium line-clamp-2">
                      {item?.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="sop-body-xs-medium text-sop-neutral-gray-400 md:sop-body-md-regular">
                      ตัวเลือกสินค้า : {item?.variant?.title || "-"}
                    </p>
                    <p
                      className="sop-body-xs-medium md:text-sop-base-black text-sop-neutral-gray-400 md:sop-body-md-medium"
                      suppressHydrationWarning
                    >
                      {convertToLocale({
                        amount: item?.unit_price || 0,
                        currency_code: order.currency_code,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="sop-body-xs-medium text-sop-neutral-gray-300 md:sop-body-md-regular">
                      x{item?.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Total & Actions */}
        <div className="border-b border-sop-neutral-grayalpha-300 pb-3 md:pb-5 flex items-center justify-between">
          <p className="sop-body-md-regular md:sop-body-lg-regular text-sop-neutral-gray-300">
            รวมทั้งสิ้น
          </p>
          <p
            className="text-sop-secondary-500 md:sop-body-md-medium sop-body-sm-medium"
            suppressHydrationWarning
          >
            {convertToLocale({
              amount: calculatedTotal,
              currency_code: order.currency_code,
            })}
          </p>
        </div>

        {displayStatus === "to-pay" && (
          <PendingPromptPayCountdownBar order={order} variant="card" />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end items-center">
          {/* TO PAY STATUS */}
          {displayStatus === "to-pay" && (
            <>
              <Button onClick={() => openModal("payment", order.id)}>
                ชำระเงิน
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  openModal("change-payment", order.id)
                }}
              >
                เปลี่ยนช่องทางการชำระเงิน
              </Button>
            </>
          )}

          {/* TO RECEIVE STATUS */}
          {displayStatus === "to-receive" && (
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

          {/* COMPLETED STATUS */}
          {displayStatus === "completed" && !hasAnyReviewed && (
            <>
              <Button onClick={() => openModal("review", order.id)}>
                รีวิวสินค้า
              </Button>
            </>
          )}

          {/* VIEW DETAILS */}
          {(displayStatus === "to-receive" ||
            displayStatus === "completed" ||
            displayStatus === "preparing" ||
            displayStatus === "cancelled") && (
            <LocalizedClientLink href={`/user/orders/${order.id}`}>
              <Button variant="outline">ดูรายละเอียด</Button>
            </LocalizedClientLink>
          )}

          {/* Desktop Only Actions */}
          {displayStatus === "completed" && (
            <Button
              variant="secondary"
              className="hidden md:flex"
              onClick={() => {
                console.log("Return order clicked")
              }}
            >
              คืนสินค้า
            </Button>
          )}

          {displayStatus === "to-pay" && (
            <Button
              variant="secondary"
              onClick={() => openModal("cancel", order.id)}
            >
              ยกเลิกคำสั่งซื้อ
            </Button>
          )}

          {/* Mobile Action Menu */}
          <div className="md:hidden">
            {(displayStatus === "to-pay" || displayStatus === "completed") && (
              <ActionMenu className="relative">
                {displayStatus === "to-pay" && (
                  <LocalizedClientLink
                    href={`/user/orders/${order.id}`}
                    className="block w-full"
                  >
                    <ActionMenuItem>ดูรายละเอียด</ActionMenuItem>
                  </LocalizedClientLink>
                )}

                {displayStatus === "completed" && (
                  <ActionMenuItem
                    onClick={() => console.log("Return order clicked")}
                  >
                    คืนสินค้า
                  </ActionMenuItem>
                )}
              </ActionMenu>
            )}
          </div>
        </div>
      </div>

      <OrderPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setPaymentSecretsBootstrap(order.id, null)
          closeModal()
        }}
        order={order}
        forceMethodSelection={false}
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

      <ChangePaymentModal
        isOpen={isChangePaymentModalOpen}
        onClose={closeModal}
        orderId={order.id}
        paymentCollectionIds={order.payment_collections
          ?.map((c) => c.id)
          .filter(Boolean)}
        orderTotal={calculatedTotal}
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
        items={order.items}
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

export default OrderCard
