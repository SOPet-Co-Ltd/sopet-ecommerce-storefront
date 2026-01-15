// import { HttpTypes } from "@medusajs/types"
// import { NextRequest, NextResponse } from "next/server"

// // Debug toggle - can be set via environment variable or hardcoded
// const DEBUG_MIDDLEWARE = process.env.DEBUG_MIDDLEWARE === "true" || false

// const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
// const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
// const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "th"

// // Debug logging utility
// type LogType = "info" | "step" | "variable" | "response" | "timing" | "error"

// function debugLog(type: LogType, message: string, data?: any) {
//   if (!DEBUG_MIDDLEWARE) return

//   const timestamp = new Date().toISOString()
//   const prefix = `[Middleware Debug ${type.toUpperCase()}]`

//   if (data !== undefined) {
//     // Format complex objects as JSON for readability
//     const dataStr = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data)
//     console.log(`${timestamp} ${prefix} ${message}\n${dataStr}`)
//   } else {
//     console.log(`${timestamp} ${prefix} ${message}`)
//   }
// }

// // Timing utilities
// interface Timer {
//   start: number
//   label: string
// }

// function startTimer(label: string): Timer {
//   const timer = {
//     start: Date.now(),
//     label,
//   }
//   debugLog("timing", `Timer started: ${label}`)
//   return timer
// }

// function endTimer(timer: Timer): number {
//   const elapsed = Date.now() - timer.start
//   debugLog("timing", `Timer ended: ${timer.label}`, { elapsedMs: elapsed, elapsedSeconds: (elapsed / 1000).toFixed(3) })
//   return elapsed
// }

// function logEnvironmentVariables() {
//   debugLog("step", "=== Environment Variables Check ===")

//   // Log MEDUSA_BACKEND_URL
//   const backendUrl = process.env.MEDUSA_BACKEND_URL
//   debugLog("variable", "MEDUSA_BACKEND_URL", {
//     set: !!backendUrl,
//     value: backendUrl || "NOT SET",
//   })

//   // Log NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (masked for security)
//   const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
//   if (publishableKey) {
//     const maskedKey = publishableKey.length > 8 
//       ? `${publishableKey.substring(0, 8)}...` 
//       : "***"
//     debugLog("variable", "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", {
//       set: true,
//       masked: maskedKey,
//       length: publishableKey.length,
//     })
//   } else {
//     debugLog("variable", "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", { set: false })
//   }

//   // Log NEXT_PUBLIC_DEFAULT_REGION
//   const defaultRegion = process.env.NEXT_PUBLIC_DEFAULT_REGION
//   debugLog("variable", "NEXT_PUBLIC_DEFAULT_REGION", {
//     set: !!defaultRegion,
//     value: defaultRegion || `NOT SET (using fallback: ${DEFAULT_REGION})`,
//     fallback: DEFAULT_REGION,
//   })

//   // Also log to console for non-debug visibility
//   console.log("[Middleware] Environment Variables Check:")
//   console.log("=".repeat(50))
//   console.log(`MEDUSA_BACKEND_URL: ${backendUrl ? `SET (${backendUrl})` : "NOT SET"}`)
//   if (publishableKey) {
//     const maskedKey = publishableKey.length > 8 
//       ? `${publishableKey.substring(0, 8)}...` 
//       : "***"
//     console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: SET (${maskedKey}, length: ${publishableKey.length})`)
//   } else {
//     console.log("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: NOT SET")
//   }
//   console.log(`NEXT_PUBLIC_DEFAULT_REGION: ${defaultRegion ? `SET (${defaultRegion})` : `NOT SET (using fallback: ${DEFAULT_REGION})`}`)
//   console.log("=".repeat(50))
// }

// const regionMapCache = {
//   regionMap: new Map<string, HttpTypes.StoreRegion>(),
//   regionMapUpdated: Date.now(),
// }

// async function getRegionMap(cacheId: string): Promise<Map<string, HttpTypes.StoreRegion> | null> {
//   const timer = startTimer("getRegionMap")
//   debugLog("step", "=== getRegionMap() called ===", { cacheId })

//   const { regionMap, regionMapUpdated } = regionMapCache

//   debugLog("variable", "Cache state", {
//     cacheSize: regionMap.size,
//     cacheUpdated: new Date(regionMapUpdated).toISOString(),
//     cacheAgeMs: Date.now() - regionMapUpdated,
//     cacheAgeSeconds: ((Date.now() - regionMapUpdated) / 1000).toFixed(2),
//   })

//   if (!BACKEND_URL) {
//     debugLog("error", "MEDUSA_BACKEND_URL not set")
//     console.error(
//       "[Middleware] MEDUSA_BACKEND_URL environment variable is not set. Falling back to default region."
//     )
//     endTimer(timer)
//     return null
//   }

//   if (!PUBLISHABLE_API_KEY) {
//     debugLog("error", "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY not set")
//     console.error(
//       "[Middleware] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable is not set. Falling back to default region."
//     )
//     endTimer(timer)
//     return null
//   }

//   // Check if cache is valid (not empty and not stale)
//   const cacheAge = Date.now() - regionMapUpdated
//   const cacheMaxAge = 3600 * 1000 // 1 hour
//   const hasCacheEntries = !!regionMap.keys().next().value
//   const cacheIsValid = hasCacheEntries && regionMapUpdated >= Date.now() - cacheMaxAge

//   debugLog("variable", "Cache validation", {
//     hasCacheEntries,
//     cacheAgeMs: cacheAge,
//     cacheMaxAgeMs: cacheMaxAge,
//     cacheIsValid,
//     cacheIsStale: !cacheIsValid,
//   })

//   if (cacheIsValid) {
//     debugLog("step", "Using cached region map", {
//       cacheSize: regionMap.size,
//       cacheAgeSeconds: (cacheAge / 1000).toFixed(2),
//     })
//     endTimer(timer)
//     return regionMap
//   }

//   debugLog("step", "Cache invalid or empty, fetching from API")

//   // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
//   try {
//     const apiTimer = startTimer("API fetch /store/regions")
//     const apiUrl = `${BACKEND_URL}/store/regions`

//     // Create AbortController for timeout handling (10 seconds - note: this exceeds Vercel's 5-second limit, which may cause issues)
//     const controller = new AbortController()
//     const timeoutMs = 10000
//     const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

//     debugLog("variable", "API request details", {
//       url: apiUrl,
//       timeoutMs,
//       headers: {
//         "x-publishable-api-key": PUBLISHABLE_API_KEY ? `${PUBLISHABLE_API_KEY.substring(0, 8)}...` : "NOT SET",
//       },
//     })

//     const fetchStart = Date.now()
//     const response = await fetch(apiUrl, {
//       headers: {
//         "x-publishable-api-key": PUBLISHABLE_API_KEY,
//       },
//       signal: controller.signal,
//     })
//     const fetchTime = Date.now() - fetchStart

//     clearTimeout(timeoutId)
//     endTimer(apiTimer)

//     debugLog("response", "API response received", {
//       status: response.status,
//       statusText: response.statusText,
//       ok: response.ok,
//       fetchTimeMs: fetchTime,
//       headers: Object.fromEntries(response.headers.entries()),
//     })

//     if (!response.ok) {
//       const errorText = await response.text().catch(() => "Unknown error")
//       debugLog("error", "API response not OK", {
//         status: response.status,
//         statusText: response.statusText,
//         errorText,
//       })
//       console.error(
//         `[Middleware] Failed to fetch regions: ${response.status} ${response.statusText}. Response: ${errorText}. Falling back to default region.`
//       )
//       endTimer(timer)
//       return null
//     }

//     const parseTimer = startTimer("Parse JSON response")
//     const json = await response.json()
//     endTimer(parseTimer)

//     debugLog("variable", "Parsed response", {
//       hasRegions: !!json.regions,
//       regionsIsArray: Array.isArray(json.regions),
//       regionsCount: json.regions?.length || 0,
//       regions: json.regions?.map((r: HttpTypes.StoreRegion) => ({
//         id: r.id,
//         name: r.name,
//         countriesCount: r.countries?.length || 0,
//         countries: r.countries?.map((c: any) => c.iso_2),
//       })),
//     })

//     if (!json.regions || !Array.isArray(json.regions) || json.regions.length === 0) {
//       debugLog("error", "No regions in API response")
//       console.error(
//         "[Middleware] No regions found in API response. Please set up regions in your Medusa Admin. Falling back to default region."
//       )
//       endTimer(timer)
//       return null
//     }

//     // Clear existing cache before populating new data
//     const oldCacheSize = regionMapCache.regionMap.size
//     regionMapCache.regionMap.clear()
//     debugLog("step", "Cleared existing cache", { oldCacheSize })

//     // Create a map of country codes to regions.
//     const countryCodeMap: Record<string, string> = {}
//     json.regions.forEach((region: HttpTypes.StoreRegion) => {
//       region.countries?.forEach((c) => {
//         if (c.iso_2) {
//           const iso2 = c.iso_2.toLowerCase()
//           regionMapCache.regionMap.set(iso2, region)
//           countryCodeMap[iso2] = region.id || "unknown"
//         }
//       })
//     })

//     regionMapCache.regionMapUpdated = Date.now()

//     debugLog("step", "Cache updated", {
//       newCacheSize: regionMapCache.regionMap.size,
//       countryCodes: Object.keys(countryCodeMap),
//       countryCodeMap,
//       cacheUpdated: new Date(regionMapCache.regionMapUpdated).toISOString(),
//     })

//     endTimer(timer)
//     return regionMapCache.regionMap
//   } catch (error) {
//     if (error instanceof Error) {
//       if (error.name === "AbortError") {
//         debugLog("error", "API request timeout", {
//           errorName: error.name,
//           errorMessage: error.message,
//           timeoutMs: 10000,
//         })
//         console.error(
//           `[Middleware] Request to ${BACKEND_URL}/store/regions timed out after 10 seconds. This may cause middleware timeout on Vercel. Falling back to default region.`
//         )
//       } else {
//         debugLog("error", "API request error", {
//           errorName: error.name,
//           errorMessage: error.message,
//           errorStack: error.stack,
//         })
//         console.error(
//           `[Middleware] Error fetching regions from ${BACKEND_URL}/store/regions: ${error.message}. Error type: ${error.name}. Falling back to default region.`
//         )
//       }
//     } else {
//       debugLog("error", "Unknown API request error", { error })
//       console.error(
//         `[Middleware] Unknown error fetching regions from ${BACKEND_URL}/store/regions. Falling back to default region.`,
//         error
//       )
//     }
//     endTimer(timer)
//     return null
//   }
// }

// async function getCountryCode(
//   request: NextRequest,
//   regionMap: Map<string, HttpTypes.StoreRegion | number> | null
// ): Promise<string | null> {
//   const timer = startTimer("getCountryCode")
//   debugLog("step", "=== getCountryCode() called ===")

//   try {
//     debugLog("variable", "Request details", {
//       pathname: request.nextUrl.pathname,
//       method: request.method,
//       url: request.url,
//     })

//     if (!regionMap || regionMap.size === 0) {
//       debugLog("error", "Region map is empty or null", {
//         regionMapIsNull: !regionMap,
//         regionMapSize: regionMap?.size || 0,
//       })
//       console.error(
//         "[Middleware] Region map is empty or null. Using default region or skipping redirect."
//       )
//       endTimer(timer)
//       return DEFAULT_REGION || null
//     }

//     debugLog("variable", "Region map state", {
//       size: regionMap.size,
//       availableCountryCodes: Array.from(regionMap.keys()),
//     })

//     let countryCode: string | null = null

//     const vercelCountryCode = request.headers
//       .get("x-vercel-ip-country")
//       ?.toLowerCase()

//     const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

//     debugLog("variable", "Country code sources", {
//       vercelCountryCode: vercelCountryCode || "NOT SET",
//       urlCountryCode: urlCountryCode || "NOT SET",
//       defaultRegion: DEFAULT_REGION,
//       pathname: request.nextUrl.pathname,
//     })

//     debugLog("step", "Determining country code - checking URL first")
//     if (urlCountryCode && regionMap.has(urlCountryCode)) {
//       countryCode = urlCountryCode
//       debugLog("step", "Country code determined from URL", { countryCode })
//     } else {
//       debugLog("step", "URL country code not valid, checking Vercel header")
//       if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
//         countryCode = vercelCountryCode
//         debugLog("step", "Country code determined from Vercel header", { countryCode })
//       } else {
//         debugLog("step", "Vercel header not valid, checking default region")
//         if (DEFAULT_REGION && regionMap.has(DEFAULT_REGION.toLowerCase())) {
//           countryCode = DEFAULT_REGION.toLowerCase()
//           debugLog("step", "Country code determined from default region", { countryCode })
//         } else {
//           debugLog("step", "Default region not valid, using first available region")
//           // Get first available region from map
//           const firstRegionKey = regionMap.keys().next().value
//           if (firstRegionKey) {
//             countryCode = firstRegionKey
//             debugLog("step", "Country code determined from first available region", { countryCode })
//           } else {
//             debugLog("error", "No country code could be determined")
//           }
//         }
//       }
//     }

//     debugLog("variable", "Final country code determination", {
//       countryCode: countryCode || "NULL",
//       determinationMethod: countryCode === urlCountryCode ? "URL" :
//                           countryCode === vercelCountryCode ? "Vercel Header" :
//                           countryCode === DEFAULT_REGION?.toLowerCase() ? "Default Region" :
//                           countryCode ? "First Available" : "None",
//     })

//     endTimer(timer)
//     return countryCode
//   } catch (error) {
//     if (error instanceof Error) {
//       debugLog("error", "Error getting country code", {
//         errorName: error.name,
//         errorMessage: error.message,
//         errorStack: error.stack,
//       })
//       console.error(
//         `[Middleware] Error getting the country code: ${error.message}. Error type: ${error.name}. Using default region or skipping redirect.`
//       )
//     } else {
//       debugLog("error", "Unknown error getting country code", { error })
//       console.error(
//         "[Middleware] Unknown error getting the country code. Using default region or skipping redirect.",
//         error
//       )
//     }
//     endTimer(timer)
//     return DEFAULT_REGION || null
//   }
// }

// export async function middleware(request: NextRequest) {
//   const middlewareTimer = startTimer("middleware execution")
//   debugLog("step", "=== Middleware execution started ===")

//   try {
//     debugLog("variable", "Request details", {
//       method: request.method,
//       url: request.url,
//       pathname: request.nextUrl.pathname,
//       search: request.nextUrl.search,
//       origin: request.nextUrl.origin,
//       headers: Object.fromEntries(request.headers.entries()),
//       cookies: Object.fromEntries(
//         Array.from(request.cookies.getAll()).map(c => [c.name, c.value])
//       ),
//     })

//     // Log environment variables for debugging
//     logEnvironmentVariables()

//     // Handle OPTIONS requests (CORS preflight)
//     if (request.method === "OPTIONS") {
//       debugLog("step", "Handling OPTIONS request (CORS preflight)")
//       const corsResponse = new NextResponse(null, {
//         status: 200,
//         headers: {
//           "Access-Control-Allow-Origin": "*",
//           "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//           "Access-Control-Allow-Headers": "Content-Type, Authorization, x-publishable-api-key",
//           "Access-Control-Max-Age": "86400",
//         },
//       })
//       debugLog("response", "CORS preflight response", {
//         status: corsResponse.status,
//         headers: Object.fromEntries(corsResponse.headers.entries()),
//       })
//       endTimer(middlewareTimer)
//       return corsResponse
//     }

//     // Short-circuit static assets
//     const isStaticAsset = request.nextUrl.pathname.includes(".")
//     debugLog("variable", "Static asset check", {
//       pathname: request.nextUrl.pathname,
//       isStaticAsset,
//     })

//     if (isStaticAsset) {
//       debugLog("step", "Skipping static asset")
//       endTimer(middlewareTimer)
//       return NextResponse.next()
//     }

//     const cacheIdCookie = request.cookies.get("_medusa_cache_id")
//     const urlSegment = request.nextUrl.pathname.split("/")[1]
//     const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || "")

//     debugLog("variable", "URL and cookie analysis", {
//       urlSegment: urlSegment || "EMPTY",
//       looksLikeLocale,
//       hasCacheIdCookie: !!cacheIdCookie,
//       cacheIdCookieValue: cacheIdCookie?.value || "NOT SET",
//     })

//     // Fast path: URL already has a locale segment and cache cookie exists
//     if (looksLikeLocale && cacheIdCookie) {
//       debugLog("step", "Fast path: URL has locale and cache cookie exists, skipping processing")
//       endTimer(middlewareTimer)
//       return NextResponse.next()
//     }

//     debugLog("step", "Fast path conditions not met, proceeding with full processing")

//     let response = NextResponse.next()

//     // Ensure cache id cookie exists (set without redirect)
//     const cacheId = cacheIdCookie?.value || crypto.randomUUID()
//     debugLog("variable", "Cache ID", {
//       fromCookie: !!cacheIdCookie,
//       cacheId,
//     })

//     if (!cacheIdCookie) {
//       debugLog("step", "Setting cache ID cookie", {
//         cacheId,
//         maxAge: 60 * 60 * 24,
//       })
//       response.cookies.set("_medusa_cache_id", cacheId, {
//         maxAge: 60 * 60 * 24,
//       })
//     }

//     // Fetch region map with error handling
//     debugLog("step", "Fetching region map")
//     const regionMap = await getRegionMap(cacheId)

//     debugLog("variable", "Region map fetch result", {
//       hasRegionMap: !!regionMap,
//       regionMapSize: regionMap?.size || 0,
//     })

//     // If region map fetch failed, continue without redirect
//     if (!regionMap) {
//       debugLog("error", "Region map fetch failed, allowing request to proceed")
//       console.error(
//         "[Middleware] Could not fetch region map. Allowing request to proceed without locale redirect."
//       )
//       debugLog("response", "Final response (no redirect)", {
//         status: response.status,
//         hasCookies: response.cookies.getAll().length > 0,
//       })
//       endTimer(middlewareTimer)
//       return response
//     }

//     debugLog("step", "Getting country code")
//     const countryCode = await getCountryCode(request, regionMap)

//     debugLog("variable", "Country code result", {
//       countryCode: countryCode || "NULL",
//     })

//     // If we couldn't determine a country code, continue without redirect
//     if (!countryCode) {
//       debugLog("error", "Could not determine country code, allowing request to proceed")
//       console.error(
//         "[Middleware] Could not determine country code. Allowing request to proceed without locale redirect."
//       )
//       debugLog("response", "Final response (no redirect)", {
//         status: response.status,
//         hasCookies: response.cookies.getAll().length > 0,
//       })
//       endTimer(middlewareTimer)
//       return response
//     }

//     const urlHasCountryCode =
//       countryCode && request.nextUrl.pathname.split("/")[1]?.toLowerCase() === countryCode.toLowerCase()

//     debugLog("variable", "URL country code check", {
//       countryCode,
//       urlFirstSegment: request.nextUrl.pathname.split("/")[1]?.toLowerCase() || "EMPTY",
//       urlHasCountryCode,
//     })

//     // If no country code in URL but we can resolve one, redirect to locale-prefixed path
//     if (!urlHasCountryCode && countryCode) {
//       const redirectPath =
//         request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
//       const queryString = request.nextUrl.search ? request.nextUrl.search : ""
//       const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`

//       debugLog("step", "Redirecting to locale-prefixed path", {
//         originalPath: request.nextUrl.pathname,
//         redirectPath,
//         queryString,
//         redirectUrl,
//         statusCode: 307,
//       })

//       const redirectResponse = NextResponse.redirect(redirectUrl, 307)
//       debugLog("response", "Redirect response", {
//         status: redirectResponse.status,
//         location: redirectResponse.headers.get("location"),
//       })
//       endTimer(middlewareTimer)
//       return redirectResponse
//     }

//     debugLog("step", "No redirect needed, returning next response")
//     debugLog("response", "Final response", {
//       status: response.status,
//       hasCookies: response.cookies.getAll().length > 0,
//       cookies: response.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
//     })
//     endTimer(middlewareTimer)
//     return response
//   } catch (error) {
//     // Catch any unexpected errors to prevent middleware from crashing
//     if (error instanceof Error) {
//       debugLog("error", "Unexpected error in middleware", {
//         errorName: error.name,
//         errorMessage: error.message,
//         errorStack: error.stack,
//       })
//       console.error(
//         `[Middleware] Unexpected error in middleware: ${error.message}. Error type: ${error.name}. Allowing request to proceed.`,
//         error.stack
//       )
//     } else {
//       debugLog("error", "Unknown unexpected error in middleware", { error })
//       console.error(
//         "[Middleware] Unknown unexpected error in middleware. Allowing request to proceed.",
//         error
//       )
//     }
//     // Always return a response, even on error
//     endTimer(middlewareTimer)
//     return NextResponse.next()
//   }
// }

// export const config = {
//   matcher: [
//     "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
//   ],
// }

import { HttpTypes } from '@medusajs/types';
import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_ROUTES } from './lib/constants';
import { isTokenExpired } from './lib/helpers/token';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'us';

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url);

  redirectUrl.searchParams.set(reason, 'true');

  const response = NextResponse.redirect(redirectUrl);

  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now()
};

async function getRegionMap(cacheId: string): Promise<Map<string, HttpTypes.StoreRegion> | null> {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!BACKEND_URL) {
    console.error(
      '[Middleware] MEDUSA_BACKEND_URL environment variable is not set. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.'
    );
    return null;
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    const timeoutMs = 30000;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_API_KEY!
        },
        signal: controller.signal,
        next: {
          revalidate: 3600,
          tags: [`regions-${cacheId}`]
        },
        cache: 'force-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        console.error(`[Middleware] Failed to fetch regions: ${response.status} ${response.statusText}. ${json.message || 'Unknown error'}`);
        return null;
      }

      const json = await response.json();

      if (!json.regions?.length) {
        console.error('[Middleware] No regions found. Please set up regions in your Medusa Admin.');
        return null;
      }

      // Clear existing cache before populating new data
      regionMapCache.regionMap.clear();

      // Create a map of country codes to regions.
      json.regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach(c => {
          if (c.iso_2) {
            regionMapCache.regionMap.set(c.iso_2.toLowerCase(), region);
          }
        });
      });

      regionMapCache.regionMapUpdated = Date.now();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`[Middleware] Request to ${BACKEND_URL}/store/regions timed out after ${timeoutMs}ms. Falling back to default region.`);
        } else {
          console.error(`[Middleware] Error fetching regions: ${error.message}`);
        }
      } else {
        console.error('[Middleware] Unknown error fetching regions:', error);
      }
      return null;
    }
  }

  return regionMapCache.regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode;

    const vercelCountryCode = request.headers.get('x-vercel-ip-country')?.toLowerCase();

    const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode;
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode;
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION;
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value;
    }

    return countryCode;
  } catch (error) {
    console.error(
      '[Middleware] Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.',
      error
    );
  }
}

export async function middleware(request: NextRequest) {
  // Short-circuit static assets
  if (request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const cacheIdCookie = request.cookies.get('_medusa_cache_id');
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();

  const urlSegment = pathname.split('/')[1];
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || '');

  const pathnameWithoutLocale = looksLikeLocale ? pathname.replace(/^\/[^/]+/, '') : pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt');
    const token = jwtCookie?.value;

    const locale = looksLikeLocale ? urlSegment : DEFAULT_REGION;

    // Not logged in before
    if (!jwtCookie) {
      return makeAuthRedirect(request, locale, 'sessionRequired');
    }

    // Token exists but expired
    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired');
    }
  }

  // Fast path: URL already has a locale segment and cache cookie exists
  if (looksLikeLocale && cacheIdCookie) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // Ensure cache id cookie exists (set without redirect)
  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24
    });
  }

  // Fetch region map with error handling - gracefully fall back to default region on failure
  let regionMap: Map<string, HttpTypes.StoreRegion> | null = null;
  try {
    regionMap = await getRegionMap(cacheId);
  } catch (error) {
    // If getRegionMap throws (shouldn't happen now, but defensive), log and continue
    console.error('[Middleware] Unexpected error fetching region map:', error);
    regionMap = null;
  }

  // If region map fetch failed, use default region and continue without redirect
  let countryCode: string | null = null;
  if (regionMap) {
    try {
      const code = await getCountryCode(request, regionMap);
      countryCode = code || null;
    } catch (error) {
      console.error('[Middleware] Error getting country code:', error);
      countryCode = null;
    }
  }

  // Fallback to DEFAULT_REGION if we couldn't determine country code
  if (!countryCode) {
    countryCode = DEFAULT_REGION;
  }

  const urlHasCountryCode = countryCode && pathname.split('/')[1]?.toLowerCase() === countryCode.toLowerCase();

  // If no country code in URL but we can resolve one, redirect to locale-prefixed path
  if (!urlHasCountryCode && countryCode) {
    const redirectPath = pathname === '/' ? '' : pathname;
    const queryString = request.nextUrl.search ? request.nextUrl.search : '';
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};