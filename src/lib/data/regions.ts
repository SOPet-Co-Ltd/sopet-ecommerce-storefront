"use server"

import { cache } from "react"
import { sdk } from "../config"
import medusaError from "@/lib/helpers/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { REVALIDATE_REGIONS } from "@/lib/cache/constants"
import { getCacheOptions } from "./cookies"
import { DEFAULT_REGION } from "@/lib/site-defaults"

// Constants
const DEFAULT_COUNTRY_CODE = DEFAULT_REGION

// Cache key helper
const getRegionCacheKey = (id: string): string => `regions-${id}`

// Module-level cache for country code to region mapping
// This cache is populated on-demand and persists for the lifetime of the module
const regionMap = new Map<string, HttpTypes.StoreRegion>()

/**
 * Clears the in-memory region cache.
 * Useful when regions might have changed and you want to force a refresh.
 */
export const clearRegionCache = async (): Promise<void> => {
  regionMap.clear()
}

/**
 * Retrieves all available regions from the store.
 * Results are cached for 1 hour and can be invalidated using Next.js cache tags.
 * Wrapped with React `cache()` so a single request dedupes calls (e.g. layout + metadata).
 *
 * @returns Promise resolving to an array of regions, or throws an error if the request fails
 */
const listRegionsUncached = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions("regions")),
    revalidate: REVALIDATE_REGIONS,
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const listRegions = cache(listRegionsUncached)

/**
 * Retrieves a specific region by its ID.
 * Results are cached for 1 hour and can be invalidated using Next.js cache tags.
 *
 * @param id - The ID of the region to retrieve
 * @returns Promise resolving to the region object, or throws an error if the request fails
 */
export const retrieveRegion = async (
  id: string
): Promise<HttpTypes.StoreRegion> => {
  const next = {
    ...(await getCacheOptions(getRegionCacheKey(id))),
    revalidate: REVALIDATE_REGIONS,
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

/**
 * Gets a region by country code (ISO 2-letter code).
 * Uses an in-memory cache to avoid repeated API calls.
 * Falls back to the default country code (TH) if no country code is provided.
 *
 * @param countryCode - Optional ISO 2-letter country code (e.g., "us", "gb", "th")
 * @returns Promise resolving to the region object if found, null if not found or on error
 */
export const getRegion = async (
  countryCode?: string | null
): Promise<HttpTypes.StoreRegion | null> => {
  try {
    // Validate and normalize country code input
    const normalizedCountryCode =
      countryCode?.toLowerCase().trim() || DEFAULT_COUNTRY_CODE

    if (!normalizedCountryCode || normalizedCountryCode.length !== 2) {
      console.warn(
        `Invalid country code provided: "${countryCode}". Using default: "${DEFAULT_COUNTRY_CODE}"`
      )
      // Use default if invalid code provided
      const defaultRegion = regionMap.get(DEFAULT_COUNTRY_CODE)
      if (defaultRegion) {
        return defaultRegion
      }
    }

    // Check cache first
    if (regionMap.has(normalizedCountryCode)) {
      return regionMap.get(normalizedCountryCode) ?? null
    }

    // Populate cache if empty
    const regions = await listRegions()

    if (!regions || regions.length === 0) {
      console.warn("No regions found when trying to get region by country code")
      return null
    }

    // Build country code to region mapping
    // Skip countries without valid iso_2 codes to avoid invalid cache keys
    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        const iso2 = country?.iso_2?.toLowerCase().trim()
        if (iso2 && iso2.length === 2) {
          regionMap.set(iso2, region)
        }
      })
    })

    // Look up the requested country code (or default)
    const region = regionMap.get(normalizedCountryCode) ?? null

    if (!region && normalizedCountryCode !== DEFAULT_COUNTRY_CODE) {
      console.warn(
        `Region not found for country code: "${normalizedCountryCode}". Available codes: ${Array.from(regionMap.keys()).join(", ")}`
      )
    }

    return region
  } catch (error: unknown) {
    // Log error for debugging while maintaining graceful degradation
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    console.error(
      `Error retrieving region for country code "${countryCode}":`,
      errorMessage
    )
    return null
  }
}
