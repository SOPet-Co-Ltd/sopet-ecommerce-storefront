import { retrieveOrder } from "@/lib/data/orders"
import OrderDetailsTemplate from "@/components/templates/OrderDetailsTemplate/OrderDetailsTemplate"
import { notFound } from "next/navigation"
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
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPageMetadata({
    locale,
    pathname: `user/orders/${id}`,
    title: "รายละเอียดคำสั่งซื้อ",
    description:
      "ดูรายการสินค้า สถานะจัดส่ง และข้อมูลการชำระเงินของคำสั่งซื้อนี้",
    indexable: false,
  })
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, customerId] = await Promise.all([
    retrieveOrder(id).catch(() => null),
    getCurrentCustomerId(),
  ])

  if (!order) {
    return notFound()
  }

  // Determine if the authenticated customer has reviewed at least one product
  // in this order (only relevant for completed orders).
  let hasAnyReviewed = false

  if (customerId && getOrderDisplayStatus(order) === "completed") {
    const productIds = Array.from(
      new Set(
        (order.items || [])
          .map((item) => item.product?.id)
          .filter((pid): pid is string => Boolean(pid))
      )
    )

    if (productIds.length > 0) {
      const customerReviews = await getCustomerReviews(customerId)
      const reviewedPairs = new Set(
        customerReviews
          .filter(
            (review): review is typeof review & { order_id: string } =>
              typeof review.order_id === "string" && review.order_id.length > 0
          )
          .map((review) => `${review.order_id}:${review.product_id}`)
      )

      hasAnyReviewed = productIds.some((productId) =>
        reviewedPairs.has(`${order.id}:${productId}`)
      )
    }
  }

  return <OrderDetailsTemplate order={order} hasAnyReviewed={hasAnyReviewed} />
}
