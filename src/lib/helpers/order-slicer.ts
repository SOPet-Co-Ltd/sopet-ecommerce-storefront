import {
  OrderDetails,
  OrderDisplayStatus,
  FulfillmentStatus,
  OrderFulfillmentItem,
  OrderLineItem,
  OrderFulfillment,
  OrderAdjustment,
  OrderShippingMethod,
} from "@/types/order"
import { getOrderDisplayStatus } from "./order-status"

export type SlicedOrder = OrderDetails & {
  is_slice: true
  original_order_id: string
  seller_id: string
  seller_name: string
  slice_total: number
  slice_subtotal: number
  slice_shipping: number
  slice_discount: number
  slice_display_status: OrderDisplayStatus
}

function getNumericAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function getAdjustmentTotal(
  adjustments?: OrderAdjustment[] | null | undefined
): number {
  return (adjustments ?? []).reduce(
    (total, adjustment) => total + getNumericAmount(adjustment?.amount),
    0
  )
}

function getItemSubtotal(item: OrderLineItem): number {
  const quantity = getNumericAmount(item.quantity)
  const unitPrice = getNumericAmount(item.unit_price)
  const multiplied = unitPrice * quantity

  if (multiplied > 0) {
    return multiplied
  }

  return getNumericAmount(item.subtotal)
}

function getShippingMethodAmount(method: OrderShippingMethod): number {
  return getNumericAmount(method.raw_amount ?? method.amount)
}

function getShippingMethodsForSeller(
  order: OrderDetails,
  sellerId: string,
  allowOrderLevelFallback: boolean
): OrderShippingMethod[] {
  const shippingMethods = order.shipping_methods ?? []

  if (shippingMethods.length === 0) {
    return []
  }

  const matched = shippingMethods.filter(
    (method) => method.seller_id === sellerId
  )

  if (matched.length > 0) {
    return matched
  }

  return allowOrderLevelFallback ? shippingMethods : []
}

function getFulfillmentItemIds(item: OrderFulfillmentItem): string[] {
  const directIds = [item.line_item_id, item.item_id, item.id]
  const nestedIds = [item.item?.line_item_id, item.item?.item_id, item.item?.id]

  return [...directIds, ...nestedIds].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  )
}

function fulfillmentContainsAnyItem(
  fulfillment: OrderFulfillment,
  itemIds: Set<string>
): boolean {
  return (fulfillment.items ?? []).some((fulfillmentItem) =>
    getFulfillmentItemIds(fulfillmentItem).some((id) => itemIds.has(id))
  )
}

export function getSliceFulfillments(
  order: OrderDetails,
  items: OrderLineItem[]
): OrderFulfillment[] {
  const fulfillments = order.fulfillments ?? []

  if (!fulfillments.length) {
    return []
  }

  const itemIds = new Set(items.map((item) => item.id))
  const matched = fulfillments.filter((fulfillment) =>
    fulfillmentContainsAnyItem(fulfillment, itemIds)
  )

  if (matched.length > 0) {
    return matched
  }

  const isSingleSellerOrder =
    new Set(
      (order.items ?? []).map((item) => {
        const seller =
          (item as any).variant?.product?.seller || (item as any).product?.seller

        return seller?.id || "platform"
      })
    ).size === 1

  return isSingleSellerOrder ? fulfillments : []
}

export function getSliceTrackingLabels(
  order: OrderDetails,
  items: OrderLineItem[]
) {
  const seen = new Set<string>()

  return getSliceFulfillments(order, items)
    .flatMap((fulfillment) => fulfillment.labels ?? [])
    .filter((label) => {
      const key = `${label.tracking_number ?? ""}|${label.tracking_url ?? ""}`

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

function calculateSliceFulfillmentStatus(
  items: OrderLineItem[],
  fulfillments: OrderFulfillment[] = [],
  fallbackFulfillmentStatus: FulfillmentStatus,
  allowOrderLevelFallback: boolean
): FulfillmentStatus {
  if (items.length === 0) return "not_fulfilled"

  const sliceFulfillments = fulfillments.filter((fulfillment) => !fulfillment.canceled_at)

  // Status determination based on fulfillments
  if (sliceFulfillments.length > 0) {
    const isAllDelivered = sliceFulfillments.every((f) => !!f.delivered_at)
    const isSomeDelivered = sliceFulfillments.some((f) => !!f.delivered_at)
    const isAllShipped = sliceFulfillments.every((f) => !!f.shipped_at)
    const isSomeShipped = sliceFulfillments.some((f) => !!f.shipped_at)

    // If all items are in delivered fulfillments
    if (isAllDelivered) return "delivered"
    if (isSomeDelivered) return "partially_delivered"
    if (isAllShipped) return "shipped"
    if (isSomeShipped) return "partially_shipped"

    return "fulfilled"
  }

  // Fallback to item quantities if no fulfillments found (unlikely in Medusa v2 but for safety)
  const allDeliveredQuant = items.every(
    (item) => (item.delivered_quantity || 0) >= item.quantity
  )
  if (allDeliveredQuant) return "delivered"

  const someDeliveredQuant = items.some(
    (item) => (item.delivered_quantity || 0) > 0
  )
  if (someDeliveredQuant) return "partially_delivered"

  const allShippedQuant = items.every(
    (item) => (item.shipped_quantity || 0) >= item.quantity
  )
  if (allShippedQuant) return "shipped"

  const someShippedQuant = items.some((item) => (item.shipped_quantity || 0) > 0)
  if (someShippedQuant) return "partially_shipped"

  if (
    allowOrderLevelFallback &&
    fallbackFulfillmentStatus &&
    fallbackFulfillmentStatus !== "not_fulfilled"
  ) {
    return fallbackFulfillmentStatus
  }

  return "not_fulfilled"
}

/**
 * Splits a single Medusa Order into multiple "Seller Slices".
 * Each slice acts like a standalone order for UI purposes.
 */
export function sliceOrder(order: OrderDetails): SlicedOrder[] {
  const items = order.items || []
  if (items.length === 0) return []

  const totalSubtotal = items.reduce(
    (acc, item) => acc + getItemSubtotal(item),
    0
  )

  const groups: Record<string, { name: string; items: typeof items }> = {}

  items.forEach((item) => {
    const seller =
      (item as any).variant?.product?.seller || (item as any).product?.seller
    const sellerId = seller?.id || "platform"
    const sellerName = seller?.name || "ร้านค้าไม่ระบุ"

    if (!groups[sellerId]) {
      groups[sellerId] = { name: sellerName, items: [] }
    }
    groups[sellerId].items.push(item)
  })

  const groupedEntries = Object.entries(groups)
  const allowOrderLevelFallback = groupedEntries.length === 1

  return groupedEntries.map(([sellerId, group]) => {
    const sliceSubtotal = group.items.reduce(
      (acc, item) => acc + getItemSubtotal(item),
      0
    )
    const share = totalSubtotal > 0 ? sliceSubtotal / totalSubtotal : 0
    const matchedShippingMethods = getShippingMethodsForSeller(
      order,
      sellerId,
      allowOrderLevelFallback
    )
    const canUseExactShippingBreakdown =
      matchedShippingMethods.length > 0 ||
      ((order.shipping_methods?.length ?? 0) > 0 && allowOrderLevelFallback)
    const exactSliceShipping = matchedShippingMethods.reduce(
      (total, method) => total + getShippingMethodAmount(method),
      0
    )
    const exactItemDiscount = group.items.reduce(
      (total, item) => total + getAdjustmentTotal(item.adjustments),
      0
    )
    const exactShippingDiscount = matchedShippingMethods.reduce(
      (total, method) => total + getAdjustmentTotal(method.adjustments),
      0
    )
    const sliceShipping = canUseExactShippingBreakdown
      ? exactSliceShipping
      : getNumericAmount(order.shipping_total) * share
    const sliceDiscount = canUseExactShippingBreakdown
      ? exactItemDiscount + exactShippingDiscount
      : getNumericAmount(order.discount_total) * share
    const sliceTotal = sliceSubtotal + sliceShipping - sliceDiscount

    // Determine fulfillment status for THIS specific slice
    const sliceFulfillments = getSliceFulfillments(order, group.items)

    const sliceFulfillmentStatus = calculateSliceFulfillmentStatus(
      group.items,
      sliceFulfillments,
      order.fulfillment_status,
      allowOrderLevelFallback
    )

    const sliceDisplayStatus = getOrderDisplayStatus({
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: sliceFulfillmentStatus,
      metadata: order.metadata,
    })

    return {
      ...order,
      is_slice: true,
      original_order_id: order.id,
      seller_id: sellerId,
      seller_name: group.name,
      items: group.items,
      total: sliceTotal,
      subtotal: sliceSubtotal,
      shipping_total: sliceShipping,
      discount_total: sliceDiscount,
      fulfillment_status: sliceFulfillmentStatus,
      slice_total: sliceTotal,
      slice_subtotal: sliceSubtotal,
      slice_shipping: sliceShipping,
      slice_discount: sliceDiscount,
      slice_display_status: sliceDisplayStatus,
    }
  })
}
