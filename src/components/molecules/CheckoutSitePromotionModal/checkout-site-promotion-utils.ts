import type { CheckoutCoupon } from "@/types/checkout-coupon"
import type { Cart, CartAdjustment } from "@/types/cart"

export type SitePromoSelection =
  | { type: "promo"; code: string }
  | { type: "none" }

export type SitePromoBuckets = {
  available: CheckoutCoupon[]
  collectable: CheckoutCoupon[]
  unavailable: CheckoutCoupon[]
}

export function normalizeCouponCode(code: unknown): string | null {
  if (typeof code !== "string") {
    return null
  }

  const trimmed = code.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getCartPromotionCodes(cart: Cart): string[] {
  return (cart.promotions ?? [])
    .map((promotion) => normalizeCouponCode(promotion.code))
    .filter((code): code is string => code !== null)
}

function hasPromotionAdjustmentsForCode(cart: Cart, code: string): boolean {
  const normalized = code.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  const matches = (adjustments: CartAdjustment[] | null | undefined) =>
    (adjustments ?? []).some(
      (adjustment) =>
        normalizeCouponCode(adjustment.code)?.toLowerCase() === normalized
    )

  if (
    (cart.items ?? []).some((item) =>
      matches(
        (item as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
      )
    )
  ) {
    return true
  }

  return (cart.shipping_methods ?? []).some((method) =>
    matches(
      (method as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  )
}

export function isPromotionCodeOnCart(cart: Cart, code: string): boolean {
  const normalized = code.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  const onPromotions = (cart.promotions ?? []).some(
    (promotion) =>
      normalizeCouponCode(promotion.code)?.toLowerCase() === normalized
  )

  return onPromotions || hasPromotionAdjustmentsForCode(cart, code)
}

export function buildSitePromoApplyCodes(
  cart: Cart,
  sitePromos: CheckoutCoupon[],
  vendorPromos: CheckoutCoupon[],
  nextSiteCode: string
): string[] {
  const vendorCodes = new Set(
    vendorPromos
      .map((promo) => normalizeCouponCode(promo.code)?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )

  const preservedVendorCodes = getCartPromotionCodes(cart).filter((code) =>
    vendorCodes.has(code.toLowerCase())
  )

  return [...preservedVendorCodes, nextSiteCode]
}

function buildVendorPromoCodeSet(vendorPromos: CheckoutCoupon[]): Set<string> {
  return new Set(
    vendorPromos
      .map((promo) => normalizeCouponCode(promo.code)?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )
}

function collectAppliedSitePromotionCodes(
  cart: Cart,
  vendorCodes: Set<string>
): string[] {
  const seen = new Set<string>()
  const codes: string[] = []

  const addCode = (raw: unknown) => {
    const code = normalizeCouponCode(raw)
    if (!code) {
      return
    }

    const lower = code.toLowerCase()
    if (vendorCodes.has(lower) || seen.has(lower)) {
      return
    }

    seen.add(lower)
    codes.push(code)
  }

  for (const promotion of cart.promotions ?? []) {
    addCode(promotion.code)
  }

  const collectAdjustments = (
    adjustments: CartAdjustment[] | null | undefined
  ) => {
    for (const adjustment of adjustments ?? []) {
      addCode(adjustment.code)
    }
  }

  for (const item of cart.items ?? []) {
    collectAdjustments(
      (item as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  for (const method of cart.shipping_methods ?? []) {
    collectAdjustments(
      (method as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  return codes
}

function buildManualSitePromoFallback(
  cart: Cart,
  code: string
): CheckoutCoupon {
  const promotion = (cart.promotions ?? []).find(
    (entry) =>
      normalizeCouponCode(entry.code)?.toLowerCase() === code.toLowerCase()
  )

  return {
    id: promotion?.id ?? code,
    code,
    title: code,
    description: "โค้ดส่วนลดแพลตฟอร์ม",
    conditions: "",
    category: "special",
    discount_value: "",
    min_purchase: null,
    expiry_date: "",
    image_color: null,
    status: null,
    vendorName: null,
    source: "site",
    created_at: null,
    is_collected: true,
    is_used: false,
    is_eligible: true,
    ineligibility_reason: null,
    estimated_discount_amount: null,
    requires_collection: false,
  }
}

export function resolveAppliedSitePromo(
  cart: Cart,
  sitePromos: CheckoutCoupon[],
  vendorPromos: CheckoutCoupon[] = []
): CheckoutCoupon | null {
  const sitePromoByCode = new Map<string, CheckoutCoupon>()

  for (const promo of sitePromos) {
    const code = normalizeCouponCode(promo.code)?.toLowerCase()
    if (code) {
      sitePromoByCode.set(code, promo)
    }
  }

  const vendorCodes = buildVendorPromoCodeSet(vendorPromos)

  for (const code of collectAppliedSitePromotionCodes(cart, vendorCodes)) {
    const matched = sitePromoByCode.get(code.toLowerCase())
    if (matched) {
      return matched
    }

    return buildManualSitePromoFallback(cart, code)
  }

  return null
}

/**
 * Bucket site promos for the checkout site promotion modal.
 *
 * - **available** — usable right now: not used and eligible. Site promos that
 *   don't require collection (the common case) skip the wallet check entirely.
 * - **collectable** — wallet-gated coupons the customer hasn't collected yet.
 * - **unavailable** — used, or collected but ineligible (e.g. min-purchase not
 *   met, shipping not selected).
 */
export function categorizeSitePromos(
  sitePromos: CheckoutCoupon[]
): SitePromoBuckets {
  const available: CheckoutCoupon[] = []
  const collectable: CheckoutCoupon[] = []
  const unavailable: CheckoutCoupon[] = []

  for (const promo of sitePromos) {
    if (promo.is_used) {
      unavailable.push(promo)
      continue
    }

    if (promo.requires_collection && !promo.is_collected) {
      collectable.push(promo)
      continue
    }

    if (promo.is_eligible) {
      available.push(promo)
      continue
    }

    unavailable.push(promo)
  }

  return { available, collectable, unavailable }
}

function toNumericAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === "object") {
    const numericValue = (value as { numeric_?: unknown }).numeric_
    if (typeof numericValue === "number" && Number.isFinite(numericValue)) {
      return numericValue
    }

    const amountValue = (value as { amount?: unknown }).amount
    if (typeof amountValue === "number" && Number.isFinite(amountValue)) {
      return amountValue
    }
  }

  return 0
}

function extractFixedBahtAmount(raw: string): number {
  const numeric = Number(raw.replace(/[^\d.]/g, ""))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

export type ResolvePromoDiscountAmountOptions = {
  cartSubtotal?: number
  shippingTotal?: number
  appliedCartDiscount?: number
}

function sumPromotionAdjustmentsForCode(
  cart: Cart | null | undefined,
  code: string
): number | null {
  if (!cart) {
    return null
  }

  const normalizedCode = code.trim().toLowerCase()
  if (!normalizedCode) {
    return null
  }

  const isAppliedOnCart = (cart.promotions ?? []).some(
    (promotion) =>
      normalizeCouponCode(promotion.code)?.toLowerCase() === normalizedCode
  )
  if (!isAppliedOnCart) {
    return null
  }

  let total = 0
  let matched = false

  const collect = (adjustments: CartAdjustment[] | null | undefined) => {
    for (const adjustment of adjustments ?? []) {
      if (
        normalizeCouponCode(adjustment.code)?.toLowerCase() !== normalizedCode
      ) {
        continue
      }

      const amount = Math.abs(toNumericAmount(adjustment.amount))
      if (amount > 0) {
        total += amount
        matched = true
      }
    }
  }

  for (const item of cart.items ?? []) {
    collect(
      (item as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  for (const method of cart.shipping_methods ?? []) {
    collect(
      (method as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  return matched && total > 0 ? total : null
}

export function resolvePromoDiscountAmount(
  promo: CheckoutCoupon | null | undefined,
  options: ResolvePromoDiscountAmountOptions & {
    cart?: Cart | null
    selectedCode?: string | null
  } = {}
): number {
  if (!promo) {
    return 0
  }

  const selectedCode =
    options.selectedCode ?? normalizeCouponCode(promo.code) ?? null
  if (selectedCode) {
    const appliedAdjustmentTotal = sumPromotionAdjustmentsForCode(
      options.cart ?? null,
      selectedCode
    )
    if (appliedAdjustmentTotal !== null) {
      return appliedAdjustmentTotal
    }
  }

  const estimated = promo.estimated_discount_amount
  if (
    typeof estimated === "number" &&
    Number.isFinite(estimated) &&
    estimated > 0
  ) {
    return estimated
  }

  if (
    typeof options.appliedCartDiscount === "number" &&
    options.appliedCartDiscount > 0
  ) {
    return options.appliedCartDiscount
  }

  const raw = String(promo.discount_value ?? "").trim()
  if (!raw) {
    return 0
  }

  const percentMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/)
  const cartSubtotal = options.cartSubtotal ?? 0
  if (percentMatch && cartSubtotal > 0) {
    const percent = Number(percentMatch[1])
    if (Number.isFinite(percent) && percent > 0) {
      return Math.round((cartSubtotal * percent) / 100)
    }
  }

  const fixedAmount = extractFixedBahtAmount(raw)
  if (fixedAmount <= 0) {
    return 0
  }

  if (promo.category === "shipping") {
    const shippingTotal = options.shippingTotal ?? 0
    return shippingTotal > 0
      ? Math.min(fixedAmount, shippingTotal)
      : fixedAmount
  }

  return fixedAmount
}

export function formatPromoDiscountAmount(
  promo: CheckoutCoupon | null | undefined,
  options: ResolvePromoDiscountAmountOptions & {
    cart?: Cart | null
    selectedCode?: string | null
  } = {}
): string {
  const amount = resolvePromoDiscountAmount(promo, options)
  if (amount <= 0) {
    return "฿0"
  }

  return `- ฿${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function getCartSubtotalForPromoEstimate(
  cart: Cart | null | undefined
): number {
  return toNumericAmount(cart?.item_subtotal ?? cart?.subtotal ?? 0)
}

export function getCartShippingTotalForPromoEstimate(
  cart: Cart | null | undefined
): number {
  return toNumericAmount(cart?.shipping_total ?? 0)
}

/**
 * Sum the platform (site) discount from a cart's line/shipping adjustments.
 *
 * Excludes any code that matches a known vendor promo so per-seller coupons
 * never count as platform discount. The `sitePromos` argument is kept for
 * symmetry/future use; site-side filtering would drop manually entered codes
 * whose metadata isn't loaded yet.
 */
export function getSitePromotionDiscountFromCart(
  cart: Cart | null | undefined,
  _sitePromos: CheckoutCoupon[],
  vendorPromos: CheckoutCoupon[] = []
): number {
  if (!cart) {
    return 0
  }

  const vendorCodes = new Set(
    vendorPromos
      .map((promo) => normalizeCouponCode(promo.code)?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )

  let total = 0

  const collect = (adjustments: CartAdjustment[] | null | undefined) => {
    for (const adjustment of adjustments ?? []) {
      const code = normalizeCouponCode(adjustment.code)?.toLowerCase()
      if (!code || vendorCodes.has(code)) {
        continue
      }

      total += Math.abs(toNumericAmount(adjustment.amount))
    }
  }

  for (const item of cart.items ?? []) {
    collect(
      (item as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  for (const method of cart.shipping_methods ?? []) {
    collect(
      (method as { adjustments?: CartAdjustment[] | null }).adjustments ?? null
    )
  }

  return total
}

export function formatPromoMinPurchase(promo: CheckoutCoupon): string {
  if (promo.min_purchase == null || promo.min_purchase === "") {
    return "ไม่มีขั้นต่ำ"
  }

  const value = String(promo.min_purchase).trim()
  if (!value) {
    return "ไม่มีขั้นต่ำ"
  }

  if (value.startsWith("฿")) {
    return `เมื่อครบ ${value}`
  }

  const numeric = Number(value.replace(/[^\d.]/g, ""))
  if (Number.isFinite(numeric) && numeric > 0) {
    return `เมื่อครบ ฿${numeric.toLocaleString("th-TH")}`
  }

  return value
}

export function formatPromoExpiry(expiryDate: string): string {
  const trimmed = expiryDate.trim()
  if (!trimmed) {
    return ""
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return trimmed
  }

  return parsed.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

export function getInitialSelection(
  appliedSitePromo: CheckoutCoupon | null
): SitePromoSelection {
  const code = normalizeCouponCode(appliedSitePromo?.code)
  return code ? { type: "promo", code } : { type: "none" }
}

export function findPromoByCode(
  sitePromos: CheckoutCoupon[],
  code: string
): CheckoutCoupon | undefined {
  const normalized = code.toLowerCase()
  return sitePromos.find(
    (promo) => normalizeCouponCode(promo.code)?.toLowerCase() === normalized
  )
}
