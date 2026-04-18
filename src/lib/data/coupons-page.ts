"use server"

import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { fetchCoupons } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"

export type CouponsPageCategoryKey = "new_customer" | "shipping" | "special"

export type CouponsPageBundleData = {
  newCustomer: CouponData[]
  shipping: CouponData[]
  special: CouponData[]
}

export async function getCouponsPageBundleData(): Promise<CouponsPageBundleData> {
  const [newCustomerRaw, shippingRaw, specialRaw] = await Promise.all([
    fetchCoupons("new_customer"),
    fetchCoupons("shipping"),
    fetchCoupons("special"),
  ])

  return {
    newCustomer: newCustomerRaw.map(mapCouponToCardData),
    shipping: shippingRaw.map(mapCouponToCardData),
    special: specialRaw.map(mapCouponToCardData),
  }
}
