import OrderDetailsHeaderCard from "@/components/sections/OrderDetailsHeaderCard/OrderDetailsHeaderCard"
import OrderDetailsItemsCard from "@/components/sections/OrderDetailsItemsCard/OrderDetailsItemsCard"
import OrderDetailsShippingCard from "@/components/sections/OrderDetailsShippingCard/OrderDetailsShippingCard"

type OrderDetailsTemplateProps = {
  order: any
}

const OrderDetailsTemplate = ({ order }: OrderDetailsTemplateProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header & Actions Card */}
      <OrderDetailsHeaderCard order={order} />

      {/* Shipping Card */}
      <OrderDetailsShippingCard address={order.shipping_address} />

      {/* Items & Summary Card */}
      <OrderDetailsItemsCard order={order} />
    </div>
  )
}

export default OrderDetailsTemplate
