import { Divider } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"
import { Item } from "./Item"
import { useMemo } from "react"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const OrderItems = ({ order }: ItemsProps) => {
  const items = order.items ?? []

  const groupedItems = useMemo(() => {
    const groups: Record<string, { sellerName: string; items: any[] }> = {}
    
    items.forEach((item: any) => {
      const seller = item.product?.seller || (order as any).seller
      const sellerId = seller?.id || "unknown"
      const sellerName = seller?.name || "Sopet Store"
      
      if (!groups[sellerId]) {
        groups[sellerId] = { sellerName, items: [] }
      }
      groups[sellerId].items.push(item)
    })
    
    return groups
  }, [items, (order as any).seller])

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(groupedItems).map(([sellerId, group]) => (
        <div key={sellerId} className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-medium text-lg text-gray-900">{group.sellerName}</h3>
          </div>
          <div className="flex flex-col gap-2">
            {group.items
              .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
              .map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={order.currency_code}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderItems
