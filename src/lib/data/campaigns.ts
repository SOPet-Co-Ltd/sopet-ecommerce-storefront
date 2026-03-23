"use server"

import { sdk } from "../config"
import medusaError from "../helpers/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export const listCampaigns = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("campaigns")),
  }

  return sdk.client
    .fetch<{
      campaigns: Array<any>
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
