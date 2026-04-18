import type { Cart } from "@/types/cart"

function toStableAmount(value: unknown): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? String(parsed) : value
  }

  if (value && typeof value === "object") {
    const numericValue = (value as { numeric_?: unknown }).numeric_
    if (typeof numericValue === "number" && Number.isFinite(numericValue)) {
      return String(numericValue)
    }
    if (typeof numericValue === "string") {
      const parsed = Number(numericValue)
      return Number.isFinite(parsed) ? String(parsed) : numericValue
    }

    const amountValue = (value as { amount?: unknown }).amount
    if (typeof amountValue === "number" && Number.isFinite(amountValue)) {
      return String(amountValue)
    }
    if (typeof amountValue === "string") {
      const parsed = Number(amountValue)
      return Number.isFinite(parsed) ? String(parsed) : amountValue
    }
  }

  return ""
}

/**
 * Stable fingerprint for checkout payment state.
 * Includes cart lines, totals, selected shipping methods, and promotion codes so
 * stale Stripe sessions are invalidated whenever the payable state changes.
 */
export function checkoutPaymentFingerprint(
  cart: Cart | null | undefined
): string {
  if (!cart?.id) {
    return ""
  }

  const lineFingerprint = (cart.items ?? [])
    .map(
      (item) =>
        [
          item.id ?? "",
          item.variant_id ?? "",
          item.product_id ?? "",
          String(item.quantity ?? 0),
          toStableAmount(item.subtotal),
          toStableAmount(item.total),
        ].join(":")
    )
    .sort()
    .join("|")

  const shippingFingerprint = (cart.shipping_methods ?? [])
    .map(
      (method) =>
        [
          method.id ?? "",
          method.shipping_option_id ?? "",
          toStableAmount(method.amount),
        ].join(":")
    )
    .sort()
    .join("|")

  const promotionsFingerprint = (cart.promotions ?? [])
    .map(
      (promotion) =>
        `${promotion.id ?? ""}:${promotion.code ?? ""}`
    )
    .sort()
    .join("|")

  const totalsFingerprint = [
    cart.item_subtotal,
    cart.subtotal,
    cart.shipping_total,
    cart.discount_total,
    cart.tax_total,
    cart.total,
    cart.original_total,
  ]
    .map(toStableAmount)
    .join(":")

  return [
    cart.id,
    lineFingerprint,
    shippingFingerprint,
    promotionsFingerprint,
    totalsFingerprint,
  ].join("::")
}
