"use client"

import OrderListSection from "@/components/sections/OrderListSection/OrderListSection"
import { useOrdersListQuery } from "@/hooks/useOrderManagementQuery"
import type { OrdersPageBundleData } from "@/lib/data/order-management-page"

type OrdersPageClientProps = {
  initialData: OrdersPageBundleData
}

const OrdersPageClient = ({ initialData }: OrdersPageClientProps) => {
  const ordersQuery = useOrdersListQuery({
    initialData,
  })

  const orders = ordersQuery.data?.orders ?? initialData.orders
  const reviewedByOrderId =
    ordersQuery.data?.reviewedByOrderId ?? initialData.reviewedByOrderId

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="lg:flex hidden flex-col gap-2">
        <h1 className="sop-headline-md-medium">คำสั่งซื้อสินค้า</h1>
      </div>

      <OrderListSection orders={orders} reviewedByOrderId={reviewedByOrderId} />
    </div>
  )
}

export default OrdersPageClient
