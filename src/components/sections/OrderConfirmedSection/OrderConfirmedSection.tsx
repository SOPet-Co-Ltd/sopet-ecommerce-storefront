import { Heading, Text } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import type { OrderDetails as OrderDetailsType } from "@/types/order"
import OrderDetails from "@/components/organisms/OrderDefails/OrderDetails"
import OrderItems from "@/components/organisms/OrderItems/OrderItems"
import OrderTotals from "@/components/organisms/OrderDefails/OrderTotals"

const asStoreOrder = (order: OrderDetailsType): HttpTypes.StoreOrder =>
  order as unknown as HttpTypes.StoreOrder

export const OrderConfirmedSection = ({
  order,
}: {
  order: OrderDetailsType
}) => {
  return (
    <div className="py-6">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full mx-auto">
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full shadow-sm rounded-2xl p-6 md:p-10 border border-gray-100"
          data-testid="order-complete-container"
        >
          <OrderDetails order={asStoreOrder(order)} />
          <OrderItems order={asStoreOrder(order)} />
          <OrderTotals
            totals={{
              item_total: order.subtotal,
              total: order.total,
              shipping_subtotal: order.shipping_total,
              currency_code: order.currency_code,
            }}
          />
          {/* <OrderShipping order={order} /> */}
          {/*<PaymentDetails order={order} />
          <Help /> */}
        </div>
      </div>
    </div>
  )
}
