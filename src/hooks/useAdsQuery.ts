"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/react-query/query-keys"
import type { StorefrontAdsModalEntry } from "@/lib/data/ads-modal"

type AdsModalApiPayload = {
  ad?: StorefrontAdsModalEntry
}

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

const fetchAdsModal = async (): Promise<StorefrontAdsModalEntry | null> => {
  const response = await fetch("/api/ads-modal", {
    cache: "no-store",
  })

  if (response.status === 204) {
    return null
  }

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "Failed to load promotional ad")
  }

  const payload = await parseJson<AdsModalApiPayload>(response)
  return payload.ad ?? null
}

export const useAdsQuery = () =>
  useQuery({
    queryKey: queryKeys.ads.modal(),
    queryFn: fetchAdsModal,
    staleTime: 60 * 1000,
  })
