import OrderDetailsHeaderCard from "@/components/sections/OrderDetailsHeaderCard/OrderDetailsHeaderCard"
import OrderDetailsItemsCard from "@/components/sections/OrderDetailsItemsCard/OrderDetailsItemsCard"
import OrderDetailsShippingCard from "@/components/sections/OrderDetailsShippingCard/OrderDetailsShippingCard"
import type { OrderDetails } from "@/types/order"
import { getOrderStatusLabel } from "@/lib/helpers/order-status"
import { getSliceTrackingLabels, sliceOrder } from "@/lib/helpers/order-slicer"

type OrderDetailsTemplateProps = {
  order: OrderDetails
  hasAnyReviewed?: boolean
}

const OrderDetailsTemplate = ({
  order,
  hasAnyReviewed = false,
}: OrderDetailsTemplateProps) => {
  const shippingGroups = sliceOrder(order).map((slice) => ({
    sellerId: slice.seller_id,
    sellerName: slice.seller_name,
    statusLabel: getOrderStatusLabel(slice.slice_display_status),
    trackingLabels: getSliceTrackingLabels(order, slice.items)
      .map((label) => ({
        tracking_number: label.tracking_number?.trim() || null,
        tracking_url:
          label.tracking_url?.trim() && label.tracking_url?.trim() !== "#"
            ? label.tracking_url.trim()
            : null,
      }))
      .filter(
        (label) => Boolean(label.tracking_number || label.tracking_url)
      ),
  }))

  return (
    <div className="w-full flex flex-col gap-2.5 md:gap-2">
      {/* Header & Actions Card */}
      <OrderDetailsHeaderCard order={order} hasAnyReviewed={hasAnyReviewed} />

      {/* Shipping Card */}
      <OrderDetailsShippingCard
        address={order.shipping_address ?? null}
        shippingGroups={shippingGroups}
      />

      {/* Items & Summary Card */}
      <OrderDetailsItemsCard order={order} />
    </div>
  )
}

export default OrderDetailsTemplate
