import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import type { CouponData as CheckoutCouponData } from "@/lib/data/checkout-page"
import type { CouponApiData } from "@/lib/data/coupons"

function normalizeCheckoutCouponId(value: unknown): string {
  if (typeof value === "string" && value.length > 0) {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return ""
}

function normalizeCheckoutCouponCode(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function mapCouponToCardData(coupon: CouponApiData): CouponData {
  // Map category to display labels
  const categoryLabels: Record<string, { top: string; bottom: string }> = {
    new_customer: { top: "New User", bottom: "เฉพาะลูกค้าใหม่" },
    shipping: { top: "จัดส่งฟรี", bottom: "" },
    special: { top: "ส่วนลดพิเศษ", bottom: "" },
  }

  const labels = categoryLabels[coupon.category] || {
    top: "",
    bottom: "",
  }

  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    expiry: coupon.expiry_date,
    conditionsUrl: "#",
    category: coupon.category,
    conditions: coupon.conditions,
    vendorName: coupon.vendorName || undefined,
    minPurchase: coupon.min_purchase,
    leftTextTop: labels.top,
    leftTextBottom: labels.bottom,
    imageColor: coupon.image_color || undefined,
    is_collected: coupon.is_collected || false,
    is_used: coupon.is_used || false,
    isEligible: coupon.is_eligible,
    ineligibilityReason: coupon.ineligibility_reason || undefined,
  }
}

export function mapCheckoutCouponToCardData(
  coupon: CheckoutCouponData
): CouponData {
  return mapCouponToCardData({
    id: normalizeCheckoutCouponId(coupon.id),
    code: normalizeCheckoutCouponCode(coupon.code),
    title: coupon.title,
    description: coupon.description,
    conditions: coupon.conditions,
    category: coupon.category,
    discount_value: coupon.discount_value,
    min_purchase:
      coupon.min_purchase == null ? null : String(coupon.min_purchase),
    expiry_date: coupon.expiry_date,
    image_color: coupon.image_color == null ? null : String(coupon.image_color),
    status: coupon.status == null ? "" : String(coupon.status),
    vendorName: coupon.vendorName,
    created_at: coupon.created_at,
    is_collected: coupon.is_collected,
    is_used: coupon.is_used,
    is_eligible: coupon.is_eligible,
    ineligibility_reason: coupon.ineligibility_reason,
  })
}
