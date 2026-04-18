"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CouponsPageBundleData } from "@/lib/data/coupons-page"
import { queryKeys } from "@/lib/react-query/query-keys"

type CollectCouponResult = {
  success: boolean
  message?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchCouponsPageData(): Promise<CouponsPageBundleData> {
  const response = await fetch("/api/coupons/page-data", {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดคูปองได้")
  }

  return parseJson<CouponsPageBundleData>(response)
}

async function collectCouponById(couponId: string): Promise<CollectCouponResult> {
  const response = await fetch(`/api/coupons/${encodeURIComponent(couponId)}/collect`, {
    method: "POST",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถเก็บคูปองได้")
  }

  return parseJson<CollectCouponResult>(response)
}

function markCouponCollected(
  bundle: CouponsPageBundleData,
  couponId: string
): CouponsPageBundleData {
  const markCollected = <T extends { id: string; is_collected?: boolean }>(
    coupons: T[]
  ) => coupons.map((coupon) =>
      coupon.id === couponId ? { ...coupon, is_collected: true } : coupon
    )

  return {
    newCustomer: markCollected(bundle.newCustomer),
    shipping: markCollected(bundle.shipping),
    special: markCollected(bundle.special),
  }
}

export function useCouponsPageQuery(initialData: CouponsPageBundleData) {
  return useQuery({
    queryKey: queryKeys.coupons.page(),
    queryFn: fetchCouponsPageData,
    initialData,
    staleTime: 30 * 1000,
  })
}

export function useCollectCouponMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (couponId: string) => collectCouponById(couponId),
    onSuccess: async (_result, couponId) => {
      queryClient.setQueryData<CouponsPageBundleData>(
        queryKeys.coupons.page(),
        (current) => (current ? markCouponCollected(current, couponId) : current)
      )
    },
  })
}
