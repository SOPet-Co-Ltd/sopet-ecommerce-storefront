import { convertToLocale } from "@/lib/helpers/money"
import Image from "next/image"

type OrderDetailsItemsProps = {
  items: any[]
  currencyCode: string
}

const OrderDetailsItems = ({ items, currencyCode }: OrderDetailsItemsProps) => {
  const groupedItems = (() => {
    const groups: Record<string, { sellerName: string; items: any[] }> = {}
    
    items.forEach((item: any) => {
      const seller = item.product?.seller
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
    <div className="flex flex-col gap-6">
      {Object.entries(groupedItems).map(([sellerId, group]) => (
        <div key={sellerId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{group.sellerName}</h3>
            <span className="text-sm text-sop-secondary-500 font-medium">
              {/* Status could go here if needed per item/store */}
            </span>
          </div>
          <div className="divide-y divide-gray-200">
            {group.items.map((item) => (
              <div key={item.id} className="p-4 flex gap-4 items-start">
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
                  <h4 className="font-medium text-gray-900 text-sm md:text-base line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm mt-1">
                    ตัวเลือกสินค้า: {item.variant?.title || "-"}
                  </p>
                  <p className="text-gray-900 text-sm mt-1">x{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {convertToLocale({
                      amount: item.unit_price,
                      currency_code: currencyCode,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderDetailsItems
