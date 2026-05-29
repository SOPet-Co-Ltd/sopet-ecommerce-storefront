import type { CheckoutCoupon } from "@/types/checkout-coupon"
import type { Cart } from "@/types/cart"

import {
  getCartPromotionCodes,
  normalizeCouponCode,
} from "@/components/molecules/CheckoutSitePromotionModal/checkout-site-promotion-utils"

/**
 * Per-seller vendor promo helpers.
 *
 * Vendor coupons have no `seller_id`; the only association the storefront has is
 * `coupon.vendorName`, which mirrors the seller's display name. These helpers
 * scope the cart-wide vendor promo list down to a single seller and reconcile
 * the codes to apply so site promos and other sellers' coupons are preserved.
 */

export function matchesSellerName(
  promo: CheckoutCoupon,
  sellerName: string | null | undefined
): boolean {
  const promoVendor = (promo.vendorName ?? "").trim().toLowerCase()
  const seller = (sellerName ?? "").trim().toLowerCase()
  return promoVendor.length > 0 && seller.length > 0 && promoVendor === seller
}

/** Vendor promos belonging to one seller, matched by `vendorName`. */
export function filterVendorPromosForSeller(
  vendorPromos: CheckoutCoupon[],
  sellerName: string | null | undefined
): CheckoutCoupon[] {
  return vendorPromos.filter((promo) => matchesSellerName(promo, sellerName))
}

function buildCodeSet(promos: CheckoutCoupon[]): Set<string> {
  return new Set(
    promos
      .map((promo) => normalizeCouponCode(promo.code)?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )
}

/**
 * Codes to send when applying/removing a vendor promo for one seller.
 *
 * Preserves every code currently on the cart except this seller's vendor codes,
 * then appends `nextVendorCode` (omit it to remove the seller's coupon).
 */
export function buildVendorPromoApplyCodes(
  cart: Cart,
  sellerVendorPromos: CheckoutCoupon[],
  nextVendorCode: string | null
): string[] {
  const sellerCodes = buildCodeSet(sellerVendorPromos)

  const preserved = getCartPromotionCodes(cart).filter(
    (code) => !sellerCodes.has(code.toLowerCase())
  )

  if (!nextVendorCode) {
    return preserved
  }

  const normalizedNext = normalizeCouponCode(nextVendorCode)
  if (!normalizedNext) {
    return preserved
  }

  const seen = new Set(preserved.map((code) => code.toLowerCase()))
  if (seen.has(normalizedNext.toLowerCase())) {
    return preserved
  }

  return [...preserved, normalizedNext]
}

/**
 * The vendor promo for this seller that is currently applied to the cart, if
 * any. Resolved by intersecting the cart's promotion codes with this seller's
 * vendor promo list.
 */
export function resolveAppliedVendorPromo(
  cart: Cart,
  sellerVendorPromos: CheckoutCoupon[]
): CheckoutCoupon | null {
  const appliedCodes = new Set(
    getCartPromotionCodes(cart).map((code) => code.toLowerCase())
  )

  for (const promo of sellerVendorPromos) {
    const code = normalizeCouponCode(promo.code)?.toLowerCase()
    if (code && appliedCodes.has(code)) {
      return promo
    }
  }

  return null
}

export function countUsableVendorPromos(
  sellerVendorPromos: CheckoutCoupon[]
): number {
  return sellerVendorPromos.filter(
    (promo) => !promo.is_used && promo.is_eligible
  ).length
}

export type VendorPromoBuckets = {
  available: CheckoutCoupon[]
  unavailable: CheckoutCoupon[]
}

/**
 * Bucket vendor promos for the checkout store discount modal.
 *
 * Unlike site promos, store discounts are applied directly at checkout — there
 * is no "collect to wallet" step, so the collection requirement is ignored.
 *
 * - **available** — usable right now: not used and eligible.
 * - **unavailable** — used, or ineligible (e.g. min-purchase not met).
 */
export function categorizeVendorPromos(
  vendorPromos: CheckoutCoupon[]
): VendorPromoBuckets {
  const available: CheckoutCoupon[] = []
  const unavailable: CheckoutCoupon[] = []

  for (const promo of vendorPromos) {
    if (!promo.is_used && promo.is_eligible) {
      available.push(promo)
      continue
    }

    unavailable.push(promo)
  }

  return { available, unavailable }
}
