import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "th"

// Configurable fetch timeout (default: 3 seconds for production, 5 for dev)
const FETCH_TIMEOUT = process.env.MIDDLEWARE_FETCH_TIMEOUT
  ? parseInt(process.env.MIDDLEWARE_FETCH_TIMEOUT, 10)
  : process.env.NODE_ENV === "production"
  ? 3000
  : 5000

// Edge Runtime cache - note: this is per-instance and may not persist across invocations
// In production, each edge function invocation may have a fresh cache
// However, Vercel's edge caching will help reduce actual fetches
const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: 0,
}

/**
 * Fetch with proper timeout using AbortController
 * This actually cancels the request, not just stops waiting
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Fetch timeout after ${timeout}ms`)
    }
    throw error
  }
}

async function getRegionMap(cacheId: string): Promise<Map<string, HttpTypes.StoreRegion> | null> {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    // Only log in development to avoid noise in production logs
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: MEDUSA_BACKEND_URL is not set. Please define it in your environment variables."
      )
    }
    return null
  }

  const now = Date.now()
  const cacheAge = now - regionMapUpdated
  const CACHE_TTL = 3600 * 1000 // 1 hour

  // Check if cache is valid (has entries and is not expired)
  const hasValidCache = regionMap.size > 0 && cacheAge < CACHE_TTL

  if (!hasValidCache) {
    try {
      // Fetch regions from Medusa with timeout
      // We can't use the JS client here because middleware is running on Edge
      const response = await fetchWithTimeout(
        `${BACKEND_URL}/store/regions`,
        {
          headers: {
            "x-publishable-api-key": PUBLISHABLE_API_KEY || "",
          },
          // Use Vercel's edge caching - this will cache at the edge level
          // which persists across invocations better than in-memory cache
          // Note: In middleware, we use 'force-cache' for edge-level caching
          cache: "force-cache",
        },
        FETCH_TIMEOUT
      )

      if (!response.ok) {
        // Only log non-5xx errors in production (5xx might be temporary)
        if (response.status < 500 || process.env.NODE_ENV === "development") {
          const errorText = await response.text().catch(() => "Unknown error")
          console.error(
            `Middleware.ts: Failed to fetch regions. Status: ${response.status}, Error: ${errorText}`
          )
        }
        // Return existing cache if available, otherwise null
        return regionMap.size > 0 ? regionMap : null
      }

      const json = await response.json()
      const { regions } = json

      if (!regions?.length) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Middleware.ts: No regions found. Please set up regions in your Medusa Admin."
          )
        }
        // Return existing cache if available, otherwise null
        return regionMap.size > 0 ? regionMap : null
      }

      // Clear and rebuild the map
      regionMapCache.regionMap.clear()

      // Create a map of country codes to regions
      regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          if (c.iso_2) {
            regionMapCache.regionMap.set(c.iso_2.toLowerCase(), region)
          }
        })
      })

      regionMapCache.regionMapUpdated = now
    } catch (error) {
      // Only log in development or if it's not a timeout (timeouts are expected)
      const isTimeout = error instanceof Error && error.message.includes("timeout")
      if (process.env.NODE_ENV === "development" || !isTimeout) {
        console.error("Middleware.ts: Error fetching regions:", error)
      }
      // Return existing cache if available, otherwise null
      return regionMap.size > 0 ? regionMap : null
    }
  }

  return regionMapCache.regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion> | null
): Promise<string | null> {
  if (!regionMap || regionMap.size === 0) {
    return null
  }

  try {
    let countryCode: string | null = null

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION.toLowerCase())) {
      countryCode = DEFAULT_REGION.toLowerCase()
    } else {
      // Get the first available region's first country code
      const firstRegion = regionMap.values().next().value
      if (firstRegion?.countries?.[0]?.iso_2) {
        countryCode = firstRegion.countries[0].iso_2.toLowerCase()
      }
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code:",
        error
      )
    }
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Short-circuit API routes - they don't need region handling
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Short-circuit static assets
  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const urlSegment = pathname.split("/")[1]
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || "")

  // Fast path: URL already has a locale segment - skip region lookup
  // This avoids the expensive fetch operation for most requests
  if (looksLikeLocale) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  // Ensure cache id cookie exists (set without redirect)
  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()
  if (!cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
      httpOnly: false, // Needs to be accessible for cache ID
    })
  }

  // Try to get region map - this may return null if fetch fails or times out
  const regionMap = await getRegionMap(cacheId)
  
  // If we can't get regions, allow the request to proceed without redirect
  // This prevents the middleware from blocking all traffic if the backend is down
  if (!regionMap || regionMap.size === 0) {
    return response
  }

  const countryCode = await getCountryCode(request, regionMap)

  // If we can't determine a country code, allow the request to proceed
  if (!countryCode) {
    return response
  }

  const urlHasCountryCode =
    urlSegment?.toLowerCase() === countryCode.toLowerCase()

  // If no country code in URL but we can resolve one, redirect to locale-prefixed path
  if (!urlHasCountryCode) {
    const redirectPath = pathname === "/" ? "" : pathname
    const queryString = request.nextUrl.search || ""
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    return NextResponse.redirect(redirectUrl, 307)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
