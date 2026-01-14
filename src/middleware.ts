import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "th"

function logEnvironmentVariables() {
  console.log("[Middleware] Environment Variables Check:")
  console.log("=".repeat(50))
  
  // Log MEDUSA_BACKEND_URL
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  console.log(`MEDUSA_BACKEND_URL: ${backendUrl ? `SET (${backendUrl})` : "NOT SET"}`)
  
  // Log NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (masked for security)
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (publishableKey) {
    const maskedKey = publishableKey.length > 8 
      ? `${publishableKey.substring(0, 8)}...` 
      : "***"
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: SET (${maskedKey}, length: ${publishableKey.length})`)
  } else {
    console.log("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: NOT SET")
  }
  
  // Log NEXT_PUBLIC_DEFAULT_REGION
  const defaultRegion = process.env.NEXT_PUBLIC_DEFAULT_REGION
  console.log(`NEXT_PUBLIC_DEFAULT_REGION: ${defaultRegion ? `SET (${defaultRegion})` : `NOT SET (using fallback: ${DEFAULT_REGION})`}`)
  
  console.log("=".repeat(50))
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string): Promise<Map<string, HttpTypes.StoreRegion> | null> {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    console.error(
      "[Middleware] MEDUSA_BACKEND_URL environment variable is not set. Falling back to default region."
    )
    return null
  }

  if (!PUBLISHABLE_API_KEY) {
    console.error(
      "[Middleware] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable is not set. Falling back to default region."
    )
    return null
  }

  // Check if cache is valid (not empty and not stale)
  const cacheIsValid = regionMap.keys().next().value && regionMapUpdated >= Date.now() - 3600 * 1000

  if (cacheIsValid) {
    return regionMap
  }

  // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
  try {
    // Create AbortController for timeout handling (3 seconds to stay under Vercel's 5-second limit)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(
        `[Middleware] Failed to fetch regions: ${response.status} ${response.statusText}. Response: ${errorText}. Falling back to default region.`
      )
      return null
    }

    const json = await response.json()

    if (!json.regions || !Array.isArray(json.regions) || json.regions.length === 0) {
      console.error(
        "[Middleware] No regions found in API response. Please set up regions in your Medusa Admin. Falling back to default region."
      )
      return null
    }

    // Clear existing cache before populating new data
    regionMapCache.regionMap.clear()

    // Create a map of country codes to regions.
    json.regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        if (c.iso_2) {
          regionMapCache.regionMap.set(c.iso_2.toLowerCase(), region)
        }
      })
    })

    regionMapCache.regionMapUpdated = Date.now()

    return regionMapCache.regionMap
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(
          `[Middleware] Request to ${BACKEND_URL}/store/regions timed out after 3 seconds. This may cause middleware timeout on Vercel. Falling back to default region.`
        )
      } else {
        console.error(
          `[Middleware] Error fetching regions from ${BACKEND_URL}/store/regions: ${error.message}. Error type: ${error.name}. Falling back to default region.`
        )
      }
    } else {
      console.error(
        `[Middleware] Unknown error fetching regions from ${BACKEND_URL}/store/regions. Falling back to default region.`,
        error
      )
    }
    return null
  }
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number> | null
): Promise<string | null> {
  try {
    if (!regionMap || regionMap.size === 0) {
      console.error(
        "[Middleware] Region map is empty or null. Using default region or skipping redirect."
      )
      return DEFAULT_REGION || null
    }

    let countryCode: string | null = null

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (DEFAULT_REGION && regionMap.has(DEFAULT_REGION.toLowerCase())) {
      countryCode = DEFAULT_REGION.toLowerCase()
    } else {
      // Get first available region from map
      const firstRegionKey = regionMap.keys().next().value
      if (firstRegionKey) {
        countryCode = firstRegionKey
      }
    }

    return countryCode
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[Middleware] Error getting the country code: ${error.message}. Error type: ${error.name}. Using default region or skipping redirect.`
      )
    } else {
      console.error(
        "[Middleware] Unknown error getting the country code. Using default region or skipping redirect.",
        error
      )
    }
    return DEFAULT_REGION || null
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Log environment variables for debugging
    logEnvironmentVariables()

    // Handle OPTIONS requests (CORS preflight)
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-publishable-api-key",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    // Short-circuit static assets
    if (request.nextUrl.pathname.includes(".")) {
      return NextResponse.next()
    }

    const cacheIdCookie = request.cookies.get("_medusa_cache_id")
    const urlSegment = request.nextUrl.pathname.split("/")[1]
    const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || "")

    // Fast path: URL already has a locale segment and cache cookie exists
    if (looksLikeLocale && cacheIdCookie) {
      return NextResponse.next()
    }

    let response = NextResponse.next()

    // Ensure cache id cookie exists (set without redirect)
    const cacheId = cacheIdCookie?.value || crypto.randomUUID()
    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }

    // Fetch region map with error handling
    const regionMap = await getRegionMap(cacheId)
    
    // If region map fetch failed, continue without redirect
    if (!regionMap) {
      console.error(
        "[Middleware] Could not fetch region map. Allowing request to proceed without locale redirect."
      )
      return response
    }

    const countryCode = await getCountryCode(request, regionMap)

    // If we couldn't determine a country code, continue without redirect
    if (!countryCode) {
      console.error(
        "[Middleware] Could not determine country code. Allowing request to proceed without locale redirect."
      )
      return response
    }

    const urlHasCountryCode =
      countryCode && request.nextUrl.pathname.split("/")[1]?.toLowerCase() === countryCode.toLowerCase()

    // If no country code in URL but we can resolve one, redirect to locale-prefixed path
    if (!urlHasCountryCode && countryCode) {
      const redirectPath =
        request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
      const queryString = request.nextUrl.search ? request.nextUrl.search : ""
      const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
      return NextResponse.redirect(redirectUrl, 307)
    }

    return response
  } catch (error) {
    // Catch any unexpected errors to prevent middleware from crashing
    if (error instanceof Error) {
      console.error(
        `[Middleware] Unexpected error in middleware: ${error.message}. Error type: ${error.name}. Allowing request to proceed.`,
        error.stack
      )
    } else {
      console.error(
        "[Middleware] Unknown unexpected error in middleware. Allowing request to proceed.",
        error
      )
    }
    // Always return a response, even on error
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
