/**
 * Extract order ID from complete-cart API response.
 * Supports Medusa format ({ type: "order", order: { id } }) and order_set format.
 */
export function getOrderIdFromPlaceOrderResponse(res: {
  ok?: boolean
  data?: unknown
}): string | null {
  if (!res?.ok || !res?.data || typeof res.data !== "object") return null
  const d = res.data as Record<string, unknown>
  if (d.order_set && typeof d.order_set === "object") {
    const set = d.order_set as { orders?: Array<{ id?: string }> }
    const id = set?.orders?.[0]?.id
    if (typeof id === "string") return id
  }
  if (d.type === "order" && d.order && typeof d.order === "object") {
    const id = (d.order as { id?: string }).id
    if (typeof id === "string") return id
  }
  if (d.order && typeof d.order === "object") {
    const id = (d.order as { id?: string }).id
    if (typeof id === "string") return id
  }
  if (d.type === "order" && typeof d.order_id === "string") {
    return d.order_id
  }
  return null
}
