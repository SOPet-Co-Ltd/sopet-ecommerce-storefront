import OrderDetailsHeaderCard from "@/components/sections/OrderDetailsHeaderCard/OrderDetailsHeaderCard"
import OrderDetailsItemsCard from "@/components/sections/OrderDetailsItemsCard/OrderDetailsItemsCard"
import OrderDetailsShippingCard from "@/components/sections/OrderDetailsShippingCard/OrderDetailsShippingCard"
import type { OrderDetails } from "@/types/order"

type OrderDetailsTemplateProps = {
  order: OrderDetails
}

const OrderDetailsTemplate = ({ order }: OrderDetailsTemplateProps) => {
  console.log({ order })
  const firstTrackingLabel =
    order.fulfillments
      ?.flatMap((fulfillment) => fulfillment.labels ?? [])
      .find((label) => {
        const trackingNumber = label.tracking_number?.trim()
        const trackingUrl = label.tracking_url?.trim()

        return Boolean(trackingNumber || trackingUrl)
      }) ?? null

  const trackingNumber = firstTrackingLabel?.tracking_number?.trim() || null
  const trackingUrl = (() => {
    const candidate = firstTrackingLabel?.tracking_url?.trim()
    if (!candidate || candidate === "#") {
      return null
    }

    return candidate
  })()
  return (
    <div className="w-full flex flex-col gap-2.5 md:gap-2">
      {/* Header & Actions Card */}
      <OrderDetailsHeaderCard order={order} />

      {/* Shipping Card */}
      <OrderDetailsShippingCard
        address={order.shipping_address ?? null}
        tracking_number={trackingNumber}
        tracking_url={trackingUrl}
      />

      {/* Items & Summary Card */}
      <OrderDetailsItemsCard order={order} />
    </div>
  )
}

export default OrderDetailsTemplate
