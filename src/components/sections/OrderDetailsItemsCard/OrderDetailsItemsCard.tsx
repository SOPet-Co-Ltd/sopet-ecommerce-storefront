import { convertToLocale } from "@/lib/helpers/money"
import Image from "next/image"

type OrderDetailsItemsCardProps = {
  order: any
}

const OrderDetailsItemsCard = ({ order }: OrderDetailsItemsCardProps) => {
  const items = Array.isArray(order.items)
    ? order.items
    : typeof order.items === "string"
      ? JSON.parse(order.items)
      : []

  const groupedItems = (() => {
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
  })()

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
      <h3 className="font-bold text-gray-900 mb-4 text-base">รายการสั่งซื้อ</h3>

      {/* Grouped Items List */}
      <div className="space-y-8 mb-6">
        {Object.entries(groupedItems).map(([sellerId, group]) => (
          <div key={sellerId} className="flex flex-col gap-4">
            {/* Store Header */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-bold text-gray-900 text-sm">{group.sellerName}</h4>
            </div>

            <div className="space-y-4">
              {group.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
                    {item.thumbnail ? (
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
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                        {convertToLocale({
                          amount: item.unit_price,
                          currency_code: order.currency_code,
                        })}
                      </p>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      ตัวเลือกสินค้า : {item.variant?.title || "Default"}
                    </p>
                    <p className="text-gray-900 text-sm mt-1">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>ค่าจัดส่ง</span>
          <span className="font-medium text-gray-900">
            {convertToLocale({
              amount: order.shipping_total || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ส่วนลดร้านค้า</span>
          <span className="font-medium text-gray-900">
            {order.discount_total > 0 ? "-" : ""}
            {convertToLocale({
              amount: order.discount_total || 0,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>รวมทั้งสิ้น</span>
          <span className="text-sop-secondary-500">
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
        <span>วิธีการชำระเงิน</span>
        <span className="text-sop-neutral-grayfixed-200">
          {(() => {
            let providerId = order.payments?.[0]?.provider_id

            // Fallback for payment_collections structure
            if (!providerId && order.payment_collections?.length > 0) {
              const payments = order.payment_collections[0].payments
              if (payments && payments.length > 0) {
                providerId = payments[0].provider_id
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
  )
}

export default OrderDetailsItemsCard
