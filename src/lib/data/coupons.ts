"use server"
import { getAuthHeaders } from "./cookies"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export type CouponApiData = {
  id: string
  code: string
  title: string
  description: string
  conditions: string | null
  category: string // "new_customer" | "shipping" | "special"
  discount_value: string
  min_purchase: string | null
  expiry_date: string
  image_color: string | null
  status: string
  vendorName: string | null
  is_collected?: boolean
  is_used?: boolean
}

type CouponListResponse = {
  coupons?: CouponApiData[]
}

export type CouponMutationResponse = {
  success: boolean
  message?: string
} & Record<string, unknown>

type AuthHeaders = Awaited<ReturnType<typeof getAuthHeaders>>

const hasAuthorization = (
  authHeaders: AuthHeaders
): authHeaders is { authorization: string } => "authorization" in authHeaders

/**
 * Fetch coupons from the backend API.
 * @param category Optional category filter: "new_customer" | "shipping" | "special"
 */
export async function fetchCoupons(
  category?: string,
  limit: number = 20,
  offset: number = 0
): Promise<CouponApiData[]> {
  try {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/coupons`)
    url.searchParams.set("take", limit.toString())
    url.searchParams.set("skip", offset.toString())
    if (category) {
      url.searchParams.set("category", category)
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const headers: Record<string, string> = {
      "x-publishable-api-key": publishableKey,
    }

    const authHeaders = await getAuthHeaders()
    if (hasAuthorization(authHeaders)) {
      headers["Authorization"] = authHeaders.authorization
    }

    // Do not cache the result if fetching personalized data
    const fetchOptions: RequestInit = {
      headers,
    }

    if (!hasAuthorization(authHeaders)) {
      fetchOptions.next = { revalidate: 60 } // cache public requests
    } else {
      fetchOptions.cache = "no-store" // never cache personalized requests
      url.searchParams.set("t", Date.now().toString()) // force cache-busting
    }

    const res = await fetch(url.toString(), fetchOptions)

    if (!res.ok) {
      console.error(`Failed to fetch coupons: ${res.status}`)
      return []
    }

    const data = (await res.json()) as CouponListResponse
    return data.coupons || []
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return []
  }
}

/**
 * Collect a native promotion to the user's wallet.
 */
export async function collectCoupon(
  promotionId: string
): Promise<CouponMutationResponse> {
  try {
    const url = new URL(
      `${MEDUSA_BACKEND_URL}/store/coupons/${promotionId}/collect`
    )
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const authHeaders = await getAuthHeaders()
    if (!hasAuthorization(authHeaders)) {
      return { success: false, message: "Unauthorized" }
    }

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishableKey,
        Authorization: authHeaders.authorization,
      },
    })

    const data = (await res.json()) as CouponMutationResponse
    return data
  } catch (error) {
    console.error("Error collecting coupon:", error)
    return { success: false, message: "Network error" }
  }
}

/**
 * Fetch collected coupons for the logged-in customer's wallet.
 */
export async function fetchMyCoupons(): Promise<CouponApiData[]> {
  try {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/me/coupons`)
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const authHeaders = await getAuthHeaders()
    if (!hasAuthorization(authHeaders)) {
      return []
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-publishable-api-key": publishableKey,
        Authorization: authHeaders.authorization,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`Failed to fetch my coupons: ${res.status}`)
      return []
    }

    const data = (await res.json()) as CouponListResponse
    return data.coupons || []
  } catch (error) {
    console.error("Error fetching my coupons:", error)
    return []
  }
}

/**
 * Mark a coupon as used in the user's wallet by its promo code.
 */
export async function markCouponAsUsed(
  code: string
): Promise<CouponMutationResponse> {
  try {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/coupons/use-by-code`)
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const authHeaders = await getAuthHeaders()
    if (!hasAuthorization(authHeaders)) {
      return { success: false, message: "Unauthorized" }
    }

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
        Authorization: authHeaders.authorization,
      },
      body: JSON.stringify({ code }),
    })

    const data = (await res.json()) as CouponMutationResponse
    return data
  } catch (error) {
    console.error("Error marking coupon as used:", error)
    return { success: false, message: "Network error" }
  }
}
