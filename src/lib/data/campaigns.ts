"use server"

import { sdk } from "../config"
import medusaError from "../helpers/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export type CampaignListItem = {
  id: string
  name?: string | null
  description?: string | null
  created_at?: string | null
}

export const listCampaigns = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, string | number | boolean | undefined>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("campaigns")),
  }

  return sdk.client
    .fetch<{
      campaigns: CampaignListItem[]
    }>(`/store/campaigns`, {
      method: "GET",
      query: {
        take: limit,
        skip: offset,
        ...filters,
      },
      headers,
      next,
      cache: "no-cache",
    })
    .then(({ campaigns }) => campaigns)
    .catch((err) => medusaError(err))
}
