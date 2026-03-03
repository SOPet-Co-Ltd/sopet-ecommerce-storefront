import { convertToLocale } from "@/lib/helpers/money"
import type { OrderDetails } from "@/types/order"
import { SmartImage } from "@/components/atoms"

type OrderDetailsItemsCardProps = {
  order: OrderDetails
}

const OrderDetailsItemsCard = ({ order }: OrderDetailsItemsCardProps) => {
  const items = order.items

  return (
    <div className="bg-sop-base-white px-4 py-3 md:px-10 md:py-10">
      {/* Top Row: Title & Back */}
      <div className="hidden md:flex justify-between items-center mb-10 pb-2.5 border-b border-sop-neutral-grayalpha-300">
        <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
          รายการสั่งซื้อ
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center pb-3 border-b border-sop-neutral-grayalpha-300">
          <h3 className="sop-body-lg-medium text-sop-neutral-gray-200">
            {order.store?.name || order.seller?.name || "ร้านค้าไม่ระบุ"}
          </h3>
        </div>

        {/* Items List */}
        <div className="flex flex-col">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-2 md:gap-4 items-center w-full border-b border-sop-neutral-grayalpha-300 pb-3 md:pb-5"
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

        {/* Summary Section */}
        {/* Shipping cost */}
        <div className="flex justify-between text-gray-600 md:px-24.5">
          <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
            ค่าจัดส่ง
          </span>
          <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
            {convertToLocale({
              amount: order.shipping_total || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>

        {/* vendor discount */}
        <div className="flex justify-between text-gray-600 md:px-24.5">
          <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
            ส่วนลดร้านค้า
          </span>
          <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
            {order.discount_total > 0 ? "-" : ""}
            {convertToLocale({
              amount: order.discount_total || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>

        {/* Total */}
        <div className="pb-5 border-b border-sop-neutral-grayalpha-300 md:px-24.5">
          <div className="flex justify-between items-center">
            <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
              รวมทั้งสิ้น
            </span>
            <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-secondary-500">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex justify-between items-center md:px-24.5">
          <span className="sop-body-md-regular text-sop-neutral-gray-200 md:sop-body-lg-regular">
            วิธีการชำระเงิน
          </span>
          <span className="md:sop-body-md-medium sop-body-sm-medium text-sop-neutral-gray-200">
            {(() => {
              let providerId = order.payments?.[0]?.provider_id

              // Fallback for payment_collections structure
              const firstPaymentCollection = order.payment_collections?.[0]
              if (!providerId && firstPaymentCollection) {
                const payments = firstPaymentCollection.payments
                if (payments && payments.length > 0) {
                  providerId = payments[0]?.provider_id
                }
              }

              if (providerId === "pp_promptpay_stripe-connect") return "QR code"
              if (providerId === "pp_card_stripe-connect") return "Card"
              // Fallback or formatted ID
              return providerId || "-"
            })()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsItemsCard
