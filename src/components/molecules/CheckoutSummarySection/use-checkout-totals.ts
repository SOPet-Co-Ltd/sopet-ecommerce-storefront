"use client"

import { getSitePromotionDiscountFromCart } from "@/components/molecules/CheckoutSitePromotionModal/checkout-site-promotion-utils"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"

function toNumericAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (value && typeof value === "object") {
    const numericValue = (value as { numeric_?: unknown }).numeric_
    if (typeof numericValue === "number" && Number.isFinite(numericValue))
      return numericValue
  }
  return 0
}

export const formatPrice = (price: number) => `฿${price.toFixed(2)}`

export type CheckoutTotals = {
  totalQuantity: number
  subtotal: number
  platformDiscount: number
  vendorDiscount: number
  shippingFee: number
  totalSaving: number
  finalPrice: number
}

export function useCheckoutTotals(): CheckoutTotals {
  const cart = useCheckoutStore((state) => state.cart)
  const sitePromos = useCheckoutStore((state) => state.sitePromos)
  const vendorPromos = useCheckoutStore((state) => state.vendorPromos)
  const selectedShippingMethodBySellerId = useCheckoutStore(
    (state) => state.selectedShippingMethodBySellerId
  )
  const vendorShippingBySellerId = useCheckoutStore(
    (state) => state.vendorShippingBySellerId
  )

  const totalQuantity =
    cart?.items?.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0
    ) ?? 0

  const subtotal = toNumericAmount(cart?.item_subtotal ?? cart?.subtotal ?? 0)
  const platformDiscount = getSitePromotionDiscountFromCart(
    cart,
    sitePromos,
    vendorPromos
  )
  const discountTotal = toNumericAmount(cart?.discount_total ?? 0)
  const vendorDiscount = Math.max(0, discountTotal - platformDiscount)

  const shippingFee = Object.entries(selectedShippingMethodBySellerId).reduce(
    (sum, [sellerId, optionId]) => {
      const option = vendorShippingBySellerId[sellerId]?.options?.find(
        (opt) => opt.id === optionId
      )
      return sum + toNumericAmount(option?.amount ?? 0)
    },
    0
  )
  const totalSaving = vendorDiscount + platformDiscount
  const finalPrice = subtotal - totalSaving + shippingFee

  return {
    totalQuantity,
    subtotal,
    platformDiscount,
    vendorDiscount,
    shippingFee,
    totalSaving,
    finalPrice,
  }
}
