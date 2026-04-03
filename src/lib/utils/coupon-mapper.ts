import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import type { CouponApiData } from "@/lib/data/coupons"

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
    leftTextTop: labels.top,
    leftTextBottom: labels.bottom,
    imageColor: coupon.image_color || undefined,
    is_collected: coupon.is_collected || false,
    is_used: coupon.is_used || false,
  }
}
