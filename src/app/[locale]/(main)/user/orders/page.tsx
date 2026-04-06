import OrderListSection from "@/components/sections/OrderListSection/OrderListSection"
import { listOrders } from "@/lib/data/orders"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"
import {
  getCustomerReviews,
  getCurrentCustomerId,
} from "@/lib/data/reviews"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/orders",
    title: "คำสั่งซื้อของฉัน",
    description: "ดูสถานะและประวัติคำสั่งซื้อทั้งหมดของคุณบน SOPet",
    indexable: false,
  })
}

export default async function UserPage() {
  const [orders, customerId] = await Promise.all([
    listOrders(100, 0),
    getCurrentCustomerId(),
  ])

  let reviewedByOrderId: Record<string, boolean> = {}

  if (customerId) {
    const customerReviews = await getCustomerReviews(customerId)
    const reviewedPairs = new Set(
      customerReviews
        .filter(
          (review): review is typeof review & { order_id: string } =>
            typeof review.order_id === "string" && review.order_id.length > 0
        )
        .map((review) => `${review.order_id}:${review.product_id}`)
    )

    reviewedByOrderId = orders.reduce<Record<string, boolean>>((acc, order) => {
      if (getOrderDisplayStatus(order) !== "completed") {
        acc[order.id] = false
        return acc
      }

      const productIds = Array.from(
        new Set(
          (order.items || [])
            .map((item) => item.product?.id)
            .filter((id): id is string => Boolean(id))
        )
      )

      acc[order.id] = productIds.some((productId) =>
        reviewedPairs.has(`${order.id}:${productId}`)
      )

      return acc
    }, {})
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="lg:flex hidden flex-col gap-2">
        <h1 className="sop-headline-md-medium">คำสั่งซื้อสินค้า</h1>
      </div>

      <OrderListSection orders={orders} reviewedByOrderId={reviewedByOrderId} />
    </div>
  )
}
