"use server"

import { fetchQuery } from "@/lib/config"

type AdsModalMetadata = Record<string, unknown> | null

type StoreAdsModalResponse = {
  ad?: {
    id?: string
    mime_type?: string
    width?: number
    height?: number
    starts_at?: string | null
    ends_at?: string | null
    metadata?: AdsModalMetadata
    file?: {
      url?: string
    } | null
  }
}

export type StorefrontAdsModalEntry = {
  id: string
  image_url: string
  mime_type: string
  width: number
  height: number
  starts_at: string | null
  ends_at: string | null
}

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const getActiveAdsModalEntry =
  async (): Promise<StorefrontAdsModalEntry | null> => {
    const response = await fetchQuery("/store/ads-modal", {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok || response.status === 204 || !response.data) {
      return null
    }

    const payload = response.data as StoreAdsModalResponse
    const ad = payload.ad

    if (!ad) {
      return null
    }

    const id = asNonEmptyString(ad.id)
    const mimeType = asNonEmptyString(ad.mime_type)
    const imageUrl = asNonEmptyString(ad.file?.url)

    if (
      !id ||
      !mimeType ||
      !imageUrl ||
      typeof ad.width !== "number" ||
      typeof ad.height !== "number"
    ) {
      return null
    }

    return {
      id,
      image_url: imageUrl,
      mime_type: mimeType,
      width: ad.width,
      height: ad.height,
      starts_at: ad.starts_at ?? null,
      ends_at: ad.ends_at ?? null,
    }
  }
