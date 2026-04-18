import type { OrderDetails, OrderDisplayStatus } from "@/types/order"

import { sliceOrder } from "@/lib/helpers/order-slicer"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"

export const getOrderManagementDisplayStatus = (
  order: OrderDetails
): OrderDisplayStatus => {
  const slicedOrders = sliceOrder(order)

  if (!slicedOrders.length) {
    return getOrderDisplayStatus(order)
  }

  const uniqueSliceStatuses = Array.from(
    new Set(slicedOrders.map((slice) => slice.slice_display_status))
  )

  if (uniqueSliceStatuses.length === 1) {
    return uniqueSliceStatuses[0] ?? getOrderDisplayStatus(order)
  }

  if (uniqueSliceStatuses.includes("to-pay")) {
    return "to-pay"
  }

  if (uniqueSliceStatuses.includes("preparing")) {
    return "preparing"
  }

  if (uniqueSliceStatuses.includes("to-receive")) {
    return "to-receive"
  }

  if (uniqueSliceStatuses.includes("completed")) {
    return "completed"
  }

  if (uniqueSliceStatuses.includes("cancelled")) {
    return "cancelled"
  }

  return getOrderDisplayStatus(order)
}
