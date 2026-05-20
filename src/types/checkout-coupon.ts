/**
 * Canonical checkout coupon shape returned by the Medusa store endpoints
 * `/store/coupons/site` and `/store/coupons/vendor` and forwarded by the
 * storefront's checkout BFF.
 *
 * Mirror of `StoreCouponDto` in `sopet-ecommerce-backend/src/api/store/coupons/types.ts`.
 */

export type CouponCategory = "new_customer" | "shipping" | "special"
export type CouponSource = "site" | "vendor"

export type CheckoutCoupon = {
  id: string
  code: string
  title: string
  description: string
  conditions: string
  category: CouponCategory | string
  discount_value: string
  min_purchase: string | null
  expiry_date: string
  image_color: string | null
  status: string | null
  vendorName: string | null
  source: CouponSource
  created_at: string | null
  is_collected: boolean
  is_used: boolean
  is_eligible: boolean
  ineligibility_reason: string | null
  estimated_discount_amount: number | null
  /** When true, this promo must be added to the customer wallet before it can be applied. */
  requires_collection: boolean
}

export type CheckoutCouponsListResponse = {
  coupons: CheckoutCoupon[]
  count: number
  take: number
  skip: number
}

export type CheckoutPromotionsPayload = {
  site: CheckoutCoupon[]
  vendor: CheckoutCoupon[]
}
