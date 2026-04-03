"use client"

import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { OrderPaymentModal } from "@/components/organisms/OrderPaymentModal/OrderPaymentModal"
import { OrderCancelModal } from "@/components/molecules/OrderCancelModal/OrderCancelModal"
import { ChangePaymentModal } from "@/components/organisms/ChangePaymentModal/ChangePaymentModal"
import { convertToLocale } from "@/lib/helpers/money"
import { markOrderAsReceived, captureOrderPayment } from "@/lib/data/orders" // Static import for server action
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

type OrderCardProps = {
  order: any // Type will be refined based on usage
}

const OrderCard = ({ order }: OrderCardProps) => {
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

  const items = order.items || []

  const groupedItems = useMemo(() => {
    const groups: Record<string, { sellerName: string; items: any[] }> = {}

    items.forEach((item: any) => {
      const seller = item.product?.seller || order.seller
      const sellerId = seller?.id || "unknown"
      const sellerName = seller?.name || "Sopet Store"

      if (!groups[sellerId]) {
        groups[sellerId] = { sellerName, items: [] }
      }
      groups[sellerId].items.push(item)
    })

    return groups
  }, [items, order.seller])

  // Use the order's total which already includes discounts and shipping
  const calculatedTotal = useMemo(() => {
    return Number(order.total) || 0
  }, [order.total])

  return (
    <>
      <div className="bg-white flex flex-col gap-5 px-4 py-5 w-full border border-gray-200 rounded-lg">
        {Object.entries(groupedItems).map(([sellerId, group], index) => (
          <div
            key={sellerId}
            className={
              index > 0 ? "pt-5 border-t border-dashed border-gray-200" : ""
            }
          >
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <p className="font-medium text-lg text-[#211f23]">
                {group.sellerName}
              </p>
              {index === 0 && (
                <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 shrink-0 rounded-full bg-current ${statusColor}`}
                    ></span>
                    <span className={`font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Section */}
            <div className="flex flex-col gap-4 mt-4">
              {group.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center w-full">
                  {/* Image */}
                  <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    {item?.thumbnail ? (
                      <Image
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
                  <div className="flex-1 flex flex-col items-start justify-center">
                    <p className="font-medium text-base text-[#454547] line-clamp-2">
                      {item?.title}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      ตัวเลือกสินค้า : {item?.variant?.title || "-"}
                    </p>
                    <p className="text-[#454547] text-sm mt-1">
                      x{item?.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col justify-center h-full items-end">
                    <p
                      className="font-medium text-base text-black"
                      suppressHydrationWarning
                    >
                      {convertToLocale({
                        amount: item?.unit_price || 0,
                        currency_code: order.currency_code,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer: Total & Actions */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-200">
          <p className="text-[#211f23] text-lg">รวมทั้งสิ้น</p>
          <p
            className="font-medium text-sop-secondary-500 text-base"
            suppressHydrationWarning
          >
            {convertToLocale({
              amount: calculatedTotal,
              currency_code: order.currency_code,
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end items-center">
          {/* TO PAY STATUS */}
          {displayStatus === "to-pay" && (
            <>
              <Button
                className="rounded-full px-4 md:px-8 bg-sop-primary-500 hover:bg-sop-primary-600 text-white min-w-fit"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                ชำระเงิน
              </Button>

              {/* Change Payment Button */}
              <Button
                variant="outline"
                className="rounded-full px-4 md:px-8 text-sop-secondary-500 border-sop-secondary-500 hover:text-sop-secondary-600 hover:bg-sop-secondary-100 hover:border-sop-secondary-600 min-w-fit"
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
                className="rounded-full px-4 md:px-8 bg-sop-primary-500 hover:bg-sop-primary-600 text-white min-w-fit"
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
                ได้รับสินค้าแล้ว
              </Button>
            </>
          )}

          {/* COMPLETED STATUS */}
          {displayStatus === "completed" && (
            <>
              <Button
                className="rounded-full px-4 md:px-8 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white min-w-fit"
                onClick={() => setIsReviewModalOpen(true)}
              >
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
              <Button
                variant="outline"
                className="rounded-full px-4 md:px-8 text-sop-secondary-500 border-sop-secondary-500 hover:text-sop-secondary-600 hover:bg-sop-secondary-100 hover:border-sop-secondary-600 min-w-fit"
              >
                ดูรายละเอียด
              </Button>
            </LocalizedClientLink>
          )}

          {/* Desktop Only Actions */}
          {displayStatus === "completed" && (
            <Button
              variant="outline"
              className="hidden md:flex rounded-full px-8 text-sop-secondary-600 border-sop-secondary-600 hover:bg-sop-secondary-100 hover:sop-secondary-600 hover:sop-secondary-600"
              onClick={() => {
                console.log("Return order clicked")
              }}
            >
              คืนสินค้า
            </Button>
          )}

          {displayStatus === "to-pay" && (
            <Button
              variant="outline"
              className="hidden md:flex rounded-full px-8 text-sop-secondary-500 border-sop-secondary-500 hover:text-sop-secondary-600 hover:bg-sop-secondary-100 hover:border-sop-secondary-600"
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
          } catch (error) {
            console.error(error)
            window.location.reload()
          }
        }}
      />

      <ChangePaymentModal
        isOpen={isChangePaymentModalOpen}
        onClose={() => setIsChangePaymentModalOpen(false)}
        currentMethod={order.payment_provider_id}
        orderId={order.id}
        orderTotal={calculatedTotal}
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
        productName={items[0]?.title || "สินค้า"}
        productImage={items[0]?.thumbnail}
        productVariant={items[0]?.variant?.title}
        productPrice={convertToLocale({
          amount: items[0]?.unit_price || 0,
          currency_code: order.currency_code,
        })}
        onSubmit={async (data) => {
          // Mock API call for now
          console.log("Submitting review:", data)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          alert("ขอบคุณสำหรับการรีวิว! (Mock)")
        }}
      />
    </>
  )
}

export default OrderCard
