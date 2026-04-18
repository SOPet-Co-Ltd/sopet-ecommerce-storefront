"use server"

import { getCurrentCustomerId, getCustomerReviews } from "@/lib/data/reviews"
import { listOrders, retrieveOrder } from "@/lib/data/orders"
import { getOrderManagementDisplayStatus } from "@/lib/helpers/order-management-status"
import type { OrderDetails, OrderListItem } from "@/types/order"

export type OrdersPageBundleData = {
  orders: OrderListItem[]
  reviewedByOrderId: Record<string, boolean>
}

export type OrderDetailsPageBundleData = {
  order: OrderDetails | null
  hasAnyReviewed: boolean
}

export async function getOrdersPageBundleData(
  limit: number = 100,
  offset: number = 0
): Promise<OrdersPageBundleData> {
  const [orders, customerId] = await Promise.all([
    listOrders(limit, offset).catch((error) => {
      console.error("[order-management-page] Failed to load orders", error)
      return [] as OrderListItem[]
    }),
    getCurrentCustomerId().catch((error) => {
      console.error(
        "[order-management-page] Failed to load current customer id",
        error
      )
      return null
    }),
  ])

  let reviewedByOrderId: Record<string, boolean> = {}

  if (customerId) {
    const customerReviews = await getCustomerReviews(customerId).catch(
      (error) => {
        console.error(
          "[order-management-page] Failed to load customer reviews",
          error
        )
        return []
      }
    )
    const reviewedPairs = new Set(
      customerReviews
        .filter(
          (review): review is typeof review & { order_id: string } =>
            typeof review.order_id === "string" && review.order_id.length > 0
        )
        .map((review) => `${review.order_id}:${review.product_id}`)
    )

    reviewedByOrderId = orders.reduce<Record<string, boolean>>((acc, order) => {
      if (getOrderManagementDisplayStatus(order) !== "completed") {
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

  return {
    orders,
    reviewedByOrderId,
  }
}

export async function getOrderDetailsPageBundleData(
  id: string
): Promise<OrderDetailsPageBundleData> {
  const [order, customerId] = await Promise.all([
    retrieveOrder(id).catch((error) => {
      console.error("[order-management-page] Failed to retrieve order", error)
      return null
    }),
    getCurrentCustomerId().catch((error) => {
      console.error(
        "[order-management-page] Failed to retrieve current customer",
        error
      )
      return null
    }),
  ])

  if (!order) {
    return {
      order: null,
      hasAnyReviewed: false,
    }
  }

  let hasAnyReviewed = false

  if (customerId && getOrderManagementDisplayStatus(order) === "completed") {
    const productIds = Array.from(
      new Set(
        (order.items || [])
          .map((item) => item.product?.id)
          .filter((pid): pid is string => Boolean(pid))
      )
    )

    if (productIds.length > 0) {
      const customerReviews = await getCustomerReviews(customerId).catch(
        (error) => {
          console.error(
            "[order-management-page] Failed to load customer reviews",
            error
          )
          return []
        }
      )
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

  return {
    order,
    hasAnyReviewed,
  }
}
