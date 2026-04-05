import { fetchCoupons } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"
import { CouponsPageClient } from "@/components/sections/CouponsPage/CouponsPageClient"

/** Fetches on the server; `fetchCoupons` applies ISR (60s) for guests and `no-store` when authenticated. */
export default async function CouponsPage() {
  const [newCustomerRaw, shippingRaw, specialRaw] = await Promise.all([
    fetchCoupons("new_customer"),
    fetchCoupons("shipping"),
    fetchCoupons("special"),
  ])

  return (
    <CouponsPageClient
      initialNewCustomer={newCustomerRaw.map(mapCouponToCardData)}
      initialShipping={shippingRaw.map(mapCouponToCardData)}
      initialSpecial={specialRaw.map(mapCouponToCardData)}
    />
  )
}
