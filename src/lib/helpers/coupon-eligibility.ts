import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { getCartItemSeller } from "@/lib/helpers/cart-seller"
import type { Cart } from "@/types/cart"

export type CouponEligibility = {
  isEligible: boolean
  disabledReason?: string
}

const THB_FORMATTER = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
})

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() || ""

const matchesVendorName = (couponVendorName?: string, vendorName?: string) => {
  if (!vendorName) {
    return true
  }

  if (!couponVendorName) {
    return false
  }

  const normalizedCouponVendor = normalizeText(couponVendorName)
  const normalizedVendor = normalizeText(vendorName)

  if (!normalizedCouponVendor || !normalizedVendor) {
    return true
  }

  return (
    normalizedCouponVendor.includes(normalizedVendor) ||
    normalizedVendor.includes(normalizedCouponVendor)
  )
}

const toNumericAmount = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const getScopedCartAmount = (cart: Cart | null, vendorName?: string) => {
  if (!cart) {
    return 0
  }

  if (!vendorName) {
    return (
      toNumericAmount(cart.subtotal) ??
      cart.items?.reduce((sum, item) => {
        const itemTotal = toNumericAmount(item.subtotal ?? item.total)
        if (itemTotal === null) {
          return sum
        }
        return sum + itemTotal
      }, 0) ??
      0
    )
  }

  return (
    cart.items?.reduce((sum, item) => {
      const seller = getCartItemSeller(item)
      if (!matchesVendorName(seller?.name, vendorName)) {
        return sum
      }

      const itemTotal = toNumericAmount(item.subtotal ?? item.total)
      if (itemTotal === null) {
        return sum
      }

      return sum + itemTotal
    }, 0) ?? 0
  )
}

export function evaluateCouponEligibility(
  coupon: CouponData,
  options: {
    cart: Cart | null
    appliedCodes?: Set<string>
    vendorName?: string
  }
): CouponEligibility {
  const { cart, appliedCodes, vendorName } = options

  if (appliedCodes?.has(coupon.code)) {
    return { isEligible: true }
  }

  if (coupon.is_used) {
    return { isEligible: false, disabledReason: "โค้ดนี้ถูกใช้ไปแล้ว" }
  }

  if (typeof coupon.isEligible === "boolean") {
    return {
      isEligible: coupon.isEligible,
      disabledReason: coupon.ineligibilityReason,
    }
  }

  if (!matchesVendorName(coupon.vendorName, vendorName)) {
    return {
      isEligible: false,
      disabledReason: coupon.vendorName
        ? `ใช้ได้เฉพาะร้าน ${coupon.vendorName}`
        : `ใช้ได้เฉพาะคูปองของร้าน ${vendorName}`,
    }
  }

  if (
    coupon.category === "shipping" &&
    ((cart?.shipping_methods?.length ?? 0) === 0)
  ) {
    return {
      isEligible: false,
      disabledReason: "เลือกวิธีจัดส่งก่อนจึงจะใช้โค้ดนี้ได้",
    }
  }

  const minPurchase = toNumericAmount(coupon.minPurchase)
  const scopedAmount = getScopedCartAmount(cart, vendorName)

  if (minPurchase !== null && scopedAmount < minPurchase) {
    return {
      isEligible: false,
      disabledReason: `ขั้นต่ำ ${THB_FORMATTER.format(minPurchase)}`,
    }
  }

  return { isEligible: true }
}
