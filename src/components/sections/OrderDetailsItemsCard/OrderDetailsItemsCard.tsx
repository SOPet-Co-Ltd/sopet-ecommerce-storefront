import { useMemo } from "react"
import { convertToLocale } from "@/lib/helpers/money"
import type { OrderDetails } from "@/types/order"
import {
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/helpers/order-status"
import { clx } from "@medusajs/ui"
import { SmartImage } from "@/components/atoms"
import { sliceOrder } from "@/lib/helpers/order-slicer"

type OrderDetailsItemsCardProps = {
  order: OrderDetails
}

const OrderDetailsItemsCard = ({ order }: OrderDetailsItemsCardProps) => {
  const slicedOrders = useMemo(() => {
    return sliceOrder(order)
  }, [order])

  return (
    <div className="bg-sop-base-white px-4 py-3 md:px-10 md:py-10">
      {/* Top Row: Title */}
      <div className="hidden md:flex justify-between items-center mb-10 pb-2.5 border-b border-sop-neutral-grayalpha-300">
        <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
          รายการสั่งซื้อ
        </h2>
      </div>

      <div className="flex flex-col gap-10 md:gap-7.5">
        {slicedOrders.map((slice) => {
          const sellerId = slice.seller_id
          const sellerName = slice.seller_name
          const displayStatus = slice.slice_display_status

          return (
            <div key={sellerId} className="flex flex-col gap-5">
              {/* Seller Header */}
              <div className="flex items-center justify-between border-b border-sop-neutral-grayalpha-300 pb-3 mb-4">
                <p className="font-medium text-lg text-[#211f23]">
                  {sellerName}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={clx(
                      "w-2.5 h-2.5 shrink-0 rounded-full bg-current",
                      getOrderStatusColor(displayStatus)
                    )}
                  ></span>
                  <span
                    className={clx(
                      "sop-body-sm-regular md:sop-body-md-medium",
                      getOrderStatusColor(displayStatus)
                    )}
                  >
                    {getOrderStatusLabel(displayStatus)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-2.5 md:gap-5">
                {slice.items.map((item) => (
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
                      <div className="flex items-center justify-between">
                        <p className="sop-body-xs-medium text-sop-neutral-gray-300 md:sop-body-md-regular">
                          x{item?.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Store Total Breakdown */}
              <div className="flex flex-col gap-2 md:pl-24.5">
                <div className="flex justify-between items-center">
                  <span className="sop-body-sm-regular text-sop-neutral-gray-200 md:sop-body-md-regular">
                    ยอดรวมสินค้าของร้าน
                  </span>
                  <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
                    {convertToLocale({
                      amount: slice.slice_subtotal,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="sop-body-sm-regular text-sop-neutral-gray-200 md:sop-body-md-regular">
                    ค่าจัดส่ง (ปันส่วน)
                  </span>
                  <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
                    {convertToLocale({
                      amount: slice.slice_shipping,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
                {slice.slice_discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="sop-body-sm-regular text-sop-neutral-gray-200 md:sop-body-md-regular">
                      ส่วนลด (ปันส่วน)
                    </span>
                    <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-additional-red-500">
                      -
                      {convertToLocale({
                        amount: slice.slice_discount,
                        currency_code: order.currency_code,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-sop-neutral-grayalpha-200 mt-1">
                  <span className="sop-body-sm-medium text-sop-neutral-gray-300 md:sop-body-md-medium">
                    ยอดรวมของร้าน {sellerName}
                  </span>
                  <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-secondary-500">
                    {convertToLocale({
                      amount: slice.slice_total,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Global Order Summary Footer */}
        <div className="flex flex-col gap-2.5 border-t border-sop-neutral-grayalpha-300 pt-10">
          <div className="flex justify-between items-center md:pl-24.5">
            <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
              ยอดรวมทั้งสิ้น (Grand Total)
            </span>
            <span className="md:sop-body-md-medium sop-body-sm-semibold text-sop-secondary-500 text-lg">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>

          <div className="flex justify-between items-center md:pl-24.5 pt-2.5">
            <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
              วิธีการชำระเงิน
            </span>
            <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
              {(() => {
                let providerId = order.payments?.[0]?.provider_id
                const firstPaymentCollection = order.payment_collections?.[0]
                if (!providerId && firstPaymentCollection) {
                  const payments = firstPaymentCollection.payments
                  if (payments && payments.length > 0) {
                    providerId = payments[0]?.provider_id
                  }
                }
                if (providerId === "pp_promptpay_stripe-connect") return "QR code"
                if (providerId === "pp_card_stripe-connect") return "Card"
                return providerId || "-"
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsItemsCard
