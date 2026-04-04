import { fetchCoupons } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"
import { HomeCouponSectionClient } from "./HomeCouponSectionClient"

/**
 * Server-fetched coupon rail (uses `fetchCoupons` cache: revalidate 60 when
 * anonymous, no-store when authenticated). Interactive UI lives in the client
 * child.
 */
export async function HomeCouponSection() {
  const homeCoupons = await fetchCoupons(undefined, 20, 0)
  if (homeCoupons.length === 0) {
    return null
  }

  const coupons = homeCoupons.map(mapCouponToCardData)
  return <HomeCouponSectionClient initialCoupons={coupons} />
}
