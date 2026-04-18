"use client"

import OrderDetailsTemplate from "@/components/templates/OrderDetailsTemplate/OrderDetailsTemplate"
import { useOrderDetailsQuery } from "@/hooks/useOrderManagementQuery"
import type { OrderDetailsPageBundleData } from "@/lib/data/order-management-page"

type OrderDetailsPageClientProps = {
  orderId: string
  initialData: OrderDetailsPageBundleData
}

const OrderDetailsPageClient = ({
  orderId,
  initialData,
}: OrderDetailsPageClientProps) => {
  const orderQuery = useOrderDetailsQuery({
    orderId,
    initialData,
  })

  const order = orderQuery.data?.order ?? initialData.order

  if (!order) {
    return null
  }

  return (
    <OrderDetailsTemplate
      order={order}
      hasAnyReviewed={orderQuery.data?.hasAnyReviewed ?? initialData.hasAnyReviewed}
    />
  )
}

export default OrderDetailsPageClient
