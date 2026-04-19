"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { checkoutPaymentFingerprint } from "@/lib/helpers/checkout-payment-fingerprint"
import { getCartItemSellerGroup } from "@/lib/helpers/cart-seller"
import { queryKeys } from "@/lib/react-query/query-keys"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"
import type { Cart } from "@/types/cart"
import type { CouponApiData } from "@/lib/data/coupons"

type DiscountModalCouponsResponse = {
  coupons?: CouponApiData[]
  eligibilityFingerprint?: string | null
}

type CheckoutPromotionResponse = {
  cart?: Cart | null
  message?: string
}

type ApplyCheckoutPromotionArgs = {
  cartId: string
  codes: string[]
}

type RemoveCheckoutPromotionArgs = {
  cartId: string
  code: string
}

type UseDiscountModalCouponsQueryArgs = {
  cart: Cart | null
  vendorName?: string
}

type DiscountModalCouponsResult = {
  coupons: CouponData[]
  eligibilityFingerprint: string | null
}

type SellerGroupCountArgs = {
  cart: Cart | null
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

function getSellerGroupCount({ cart }: SellerGroupCountArgs) {
  if (!cart?.items?.length) {
    return 0
  }

  const sellerKeys = new Set<string>()

  for (const item of cart.items) {
    const { key } = getCartItemSellerGroup(item)

    if (key) {
      sellerKeys.add(key)
    }
  }

  return sellerKeys.size
}

async function fetchDiscountModalCoupons(args: {
  cartId?: string
  vendorName?: string
  eligibilityFingerprint?: string | null
}): Promise<DiscountModalCouponsResult> {
  const params = new URLSearchParams()

  if (args.cartId) {
    params.set("cartId", args.cartId)
  }

  if (args.vendorName) {
    params.set("vendorName", args.vendorName)
  }

  if (args.eligibilityFingerprint) {
    params.set("eligibilityFingerprint", args.eligibilityFingerprint)
  }

  const response = await fetch(`/api/checkout/coupons?${params.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดคูปองได้")
  }

  const payload = await parseJson<DiscountModalCouponsResponse>(response)
  const eligibilityFingerprint = payload.eligibilityFingerprint ?? null

  return {
    coupons: (payload.coupons ?? []).map((coupon) => ({
      ...mapCouponToCardData(coupon),
      eligibilityFingerprint: eligibilityFingerprint ?? undefined,
    })),
    eligibilityFingerprint,
  }
}

async function applyCheckoutPromotions({
  cartId,
  codes,
}: ApplyCheckoutPromotionArgs): Promise<Cart> {
  const response = await fetch("/api/checkout/promotions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cartId, codes }),
  })

  if (!response.ok) {
    const payload = await parseJson<CheckoutPromotionResponse>(response)
    throw new Error(payload.message || "ไม่สามารถใช้โค้ดส่วนลดได้")
  }

  const payload = await parseJson<CheckoutPromotionResponse>(response)

  if (!payload.cart) {
    throw new Error("ไม่พบข้อมูลตะกร้าหลังใช้โค้ดส่วนลด")
  }

  return payload.cart
}

async function removeCheckoutPromotion({
  cartId,
  code,
}: RemoveCheckoutPromotionArgs): Promise<Cart> {
  const response = await fetch(
    `/api/checkout/promotions/${encodeURIComponent(code)}?cartId=${encodeURIComponent(cartId)}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const payload = await parseJson<CheckoutPromotionResponse>(response)
    throw new Error(payload.message || "ไม่สามารถลบโค้ดส่วนลดได้")
  }

  const payload = await parseJson<CheckoutPromotionResponse>(response)

  if (!payload.cart) {
    throw new Error("ไม่พบข้อมูลตะกร้าหลังลบโค้ดส่วนลด")
  }

  return payload.cart
}

export function useDiscountModalCouponsQuery({
  cart,
  vendorName,
}: UseDiscountModalCouponsQueryArgs) {
  const cartId = typeof cart?.id === "string" && cart.id.startsWith("cart_")
    ? cart.id
    : undefined
  const sellerGroupCount = getSellerGroupCount({ cart })
  const couponEligibilityReady =
    !cartId ||
    sellerGroupCount === 0 ||
    (cart?.shipping_methods?.length ?? 0) >= sellerGroupCount
  const eligibilityFingerprint = cartId
    ? checkoutPaymentFingerprint(cart)
    : null

  const query = useQuery({
    queryKey: queryKeys.coupons.discountModal(
      cartId,
      vendorName,
      eligibilityFingerprint
    ),
    queryFn: () =>
      fetchDiscountModalCoupons({
        cartId,
        vendorName,
        eligibilityFingerprint,
      }),
    enabled: Boolean((cartId || vendorName) && couponEligibilityReady),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })

  return {
    ...query,
    couponEligibilityReady,
  }
}

export function useApplyCheckoutPromotionMutation(cartId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (codes: string[]) => {
      if (!cartId) {
        throw new Error("ไม่พบตะกร้าสำหรับใช้โค้ดส่วนลด")
      }

      return applyCheckoutPromotions({ cartId, codes })
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.checkout.cart(cart.id), cart)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.coupons.all(),
      })
    },
  })
}

export function useRemoveCheckoutPromotionMutation(cartId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      if (!cartId) {
        throw new Error("ไม่พบตะกร้าสำหรับลบโค้ดส่วนลด")
      }

      return removeCheckoutPromotion({ cartId, code })
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.checkout.cart(cart.id), cart)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.coupons.all(),
      })
    },
  })
}
