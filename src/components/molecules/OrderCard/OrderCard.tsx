"use client"

import { Button } from "@/components/atoms/Button/Button"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { OrderPaymentModal } from "@/components/organisms/OrderPaymentModal/OrderPaymentModal"
import { OrderCancelModal } from "@/components/molecules/OrderCancelModal/OrderCancelModal"
import { ChangePaymentModal } from "@/components/organisms/ChangePaymentModal/ChangePaymentModal"
import { convertToLocale } from "@/lib/helpers/money"
import { completeOrder, captureOrderPayment } from "@/lib/data/orders" // Static import for server action
import { useReviewSubmission } from "@/hooks/useReviewSubmission"
import {
  ActionMenu,
  ActionMenuItem,
} from "@/components/atoms/ActionMenu/ActionMenu"
import { ReviewModal } from "@/components/organisms/ReviewModal/ReviewModal"
import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  getOrderDisplayStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/helpers/order-status"
import type { OrderDetails, OrderLineItem } from "@/types/order"
import { SmartImage } from "@/components/atoms"
import { TimeIcon } from "@/icons"

type OrderCardProps = {
  order: OrderDetails
  hasAnyReviewed?: boolean
}

const OrderCard = ({ order, hasAnyReviewed = false }: OrderCardProps) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isChangePaymentModalOpen, setIsChangePaymentModalOpen] =
    useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [forceMethodSelection, setForceMethodSelection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const router = useRouter()

  const displayStatus = useMemo(() => getOrderDisplayStatus(order), [order])
  const statusLabel = useMemo(
    () => getOrderStatusLabel(displayStatus),
    [displayStatus]
  )
  const statusColor = useMemo(
    () => getOrderStatusColor(displayStatus),
    [displayStatus]
  )

  const items = order.items
  const { submitReviews } = useReviewSubmission()

  // Calculate total: product price + shipping
  const calculatedTotal = useMemo(() => {
    const itemsTotal = items.reduce((acc: number, item: OrderLineItem) => {
      const price = Number(item.unit_price) || 0
      const qty = Number(item.quantity) || 0
      return acc + price * qty
    }, 0)
    // Add shipping total if available
    const shipping = Number(order.shipping_total) || 0

    return itemsTotal + shipping
  }, [items, order.shipping_total])

  return (
    <>
      <div className="bg-sop-base-white flex flex-col gap-2.5 md:gap-sop-20px px-sop-16px py-sop-20px w-full">
        {/* Header */}
        <div className="border-b border-sop-neutral-grayalpha-300 pb-sop-12px flex items-center justify-between w-full">
          <p className="font-medium text-lg text-[#211f23]">
            {order.store?.name || order.seller?.name || "ร้านค้าไม่ระบุ"}
          </p>
          {/* Store Name */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 shrink-0 rounded-full bg-current ${statusColor}`}
              ></span>
              <span
                className={`sop-body-sm-regular md:sop-body-md-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="flex flex-col gap-2.5 md:gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-2 md:gap-4 items-center w-full border-b border-sop-neutral-grayalpha-300 pb-3 md:pb-5 "
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
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
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
          <div className="border-b border-sop-neutral-grayalpha-300 pb-3 md:pb-5">
            <div className="flex items-center justify-between md:justify-start gap-3 bg-sop-primary-200 rounded-sop-4px px-2 md:px-4 py-4">
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end items-center">
          {/* TO PAY STATUS */}
          {displayStatus === "to-pay" && (
            <>
              <Button onClick={() => setIsPaymentModalOpen(true)}>
                ชำระเงิน
              </Button>

              {/* Change Payment Button */}
              <Button
                variant="secondary"
                onClick={() => {
                  setIsChangePaymentModalOpen(true)
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

          {/* COMPLETED STATUS */}
          {displayStatus === "completed" && !hasAnyReviewed && (
            <>
              <Button onClick={() => setIsReviewModalOpen(true)}>
                รีวิวสินค้า
              </Button>
            </>
          )}

          {/* VIEW DETAILS - Only show as button if space or if few actions.
              Logic: 
              - to-pay: Pay + Change + Dropdown(Cancel, View)
              - to-receive: Received + View
              - completed: Review + View + Dropdown(Return, ...)
          */}
          {/* VIEW DETAILS - Only show as button if space or if few actions.
              Logic: 
              - to-pay: Pay + Change + Dropdown(Cancel, View)
              - to-receive: Received + View
              - completed: Review + View + Dropdown(Return, ...)
              - preparing: View
              - cancelled: View
          */}
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
                // TODO - Implement return flow
                console.log("Return order clicked")
              }}
            >
              คืนสินค้า
            </Button>
          )}

          {displayStatus === "to-pay" && (
            <Button
              variant="secondary"
              className="hidden md:flex"
              onClick={() => setIsCancelModalOpen(true)}
            >
              ยกเลิกคำสั่งซื้อ
            </Button>
          )}

          {/* Mobile Action Menu - For items not shown as buttons */}
          <div className="md:hidden">
            {/* Show dropdown if there are extra actions */}
            {(displayStatus === "to-pay" || displayStatus === "completed") && (
              <ActionMenu className="relative">
                {/* For To-Pay: View Details is here because we show Pay & Change Payment as buttons */}
                {displayStatus === "to-pay" && (
                  <LocalizedClientLink
                    href={`/user/orders/${order.id}`}
                    className="block w-full"
                  >
                    <ActionMenuItem>ดูรายละเอียด</ActionMenuItem>
                  </LocalizedClientLink>
                )}

                {displayStatus === "to-pay" && (
                  <ActionMenuItem onClick={() => setIsCancelModalOpen(true)}>
                    ยกเลิกคำสั่งซื้อ
                  </ActionMenuItem>
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
          setIsPaymentModalOpen(false)
          setForceMethodSelection(false)
        }}
        order={order}
        forceMethodSelection={forceMethodSelection}
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
            console.error(error)
            window.location.reload()
          }
        }}
      />

      <ChangePaymentModal
        isOpen={isChangePaymentModalOpen}
        onClose={() => setIsChangePaymentModalOpen(false)}
        orderId={order.id}
        orderTotal={calculatedTotal}
        {...(order.payment_provider_id
          ? { currentMethod: order.payment_provider_id }
          : {})}
        onConfirm={(cardId) => {
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
          router.refresh()
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
        items={items}
        onSubmit={async (reviewsData) => {
          const success = await submitReviews(reviewsData, order.id)
          if (success) {
            setIsReviewModalOpen(false)
          }
        }}
      />
    </>
  )
}

export default OrderCard
