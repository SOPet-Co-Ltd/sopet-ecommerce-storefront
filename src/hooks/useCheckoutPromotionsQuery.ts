"use client"

import { useQuery, type UseQueryResult } from "@tanstack/react-query"

import { queryKeys } from "@/lib/react-query/query-keys"
import type {
  CheckoutCoupon,
  CheckoutPromotionsPayload,
} from "@/types/checkout-coupon"

type FetchCheckoutPromotionsErrorPayload = {
  message?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return {} as T
  }
  return JSON.parse(text) as T
}

function normalizePayload(
  raw: Partial<CheckoutPromotionsPayload> | null | undefined
): CheckoutPromotionsPayload {
  return {
    site: Array.isArray(raw?.site) ? (raw.site as CheckoutCoupon[]) : [],
    vendor: Array.isArray(raw?.vendor) ? (raw.vendor as CheckoutCoupon[]) : [],
  }
}

async function fetchCheckoutPromotions(
  cartId: string
): Promise<CheckoutPromotionsPayload> {
  const response = await fetch(
    `/api/checkout/promotions?cartId=${encodeURIComponent(cartId)}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const payload =
      await parseJson<FetchCheckoutPromotionsErrorPayload>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดโค้ดส่วนลดได้")
  }

  const payload = await parseJson<CheckoutPromotionsPayload>(response)
  return normalizePayload(payload)
}

type UseCheckoutPromotionsQueryArgs = {
  cartId: string | null
  eligibilityFingerprint: string | null
  enabled?: boolean
  initialData?: CheckoutPromotionsPayload
}

/**
 * Fetches the checkout's eligible site + vendor promotions and re-runs when
 * the cart eligibility fingerprint (lines, shipping, totals, applied codes)
 * changes so freshly-met conditions (e.g. shipping selected) flip coupons to
 * eligible immediately.
 */
export function useCheckoutPromotionsQuery({
  cartId,
  eligibilityFingerprint,
  enabled = true,
  initialData,
}: UseCheckoutPromotionsQueryArgs): UseQueryResult<CheckoutPromotionsPayload> {
  return useQuery({
    queryKey: queryKeys.checkout.promotions(cartId, eligibilityFingerprint),
    queryFn: () => {
      if (!cartId) {
        return Promise.resolve<CheckoutPromotionsPayload>({
          site: [],
          vendor: [],
        })
      }
      return fetchCheckoutPromotions(cartId)
    },
    enabled: enabled && Boolean(cartId),
    initialData,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}
