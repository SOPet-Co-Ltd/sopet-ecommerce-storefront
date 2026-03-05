import OrderListSection from "@/components/sections/OrderListSection/OrderListSection"
import { listOrders } from "@/lib/data/orders"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"
import {
  checkCustomerHasReviewed,
  getCurrentCustomerId,
} from "@/lib/data/reviews"

export const dynamic = "force-dynamic"

export default async function UserPage() {
  const orders = await listOrders(100, 0)

  // Compute, for each order, whether the authenticated customer has reviewed
  // at least one product in that order.
  const customerId = await getCurrentCustomerId()

  let reviewedByOrderId: Record<string, boolean> = {}

  if (customerId) {
    const perOrderResults = await Promise.all(
      orders.map(async (order) => {
        const displayStatus = getOrderDisplayStatus(order)

        if (displayStatus !== "completed") {
          return { orderId: order.id, hasAnyReviewed: false }
        }

        const productIds = Array.from(
          new Set(
            (order.items || [])
              .map((item) => item.product?.id)
              .filter((id): id is string => Boolean(id))
          )
        )

        if (productIds.length === 0) {
          return { orderId: order.id, hasAnyReviewed: false }
        }

        const checks = await Promise.all(
          productIds.map((productId) =>
            checkCustomerHasReviewed(productId, customerId, order.id)
          )
        )

        const hasAnyReviewed = checks.some((value) => value === true)

        return { orderId: order.id, hasAnyReviewed }
      })
    )

    reviewedByOrderId = perOrderResults.reduce<Record<string, boolean>>(
      (acc, { orderId, hasAnyReviewed }) => {
        acc[orderId] = hasAnyReviewed
        return acc
      },
      {}
    )
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
