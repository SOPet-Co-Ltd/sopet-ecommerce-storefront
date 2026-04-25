import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  const cookies = await nextCookies()
  const token = cookies.get("_medusa_jwt")?.value

  if (!token) {
    return {}
  }

  return { authorization: `Bearer ${token}` }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim()
  const deletionTargets: Array<{
    domain?: string
    sameSite?: "lax" | "none"
    secure?: boolean
  }> = [
    {},
    { sameSite: "lax", secure: false },
    { sameSite: "none", secure: true },
  ]

  if (cookieDomain) {
    const normalized = cookieDomain.startsWith(".")
      ? cookieDomain
      : `.${cookieDomain}`
    deletionTargets.push(
      { domain: normalized },
      { domain: normalized, sameSite: "lax", secure: true },
      { domain: normalized, sameSite: "none", secure: true }
    )
  }

  for (const target of deletionTargets) {
    cookies.set("_medusa_jwt", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      ...(target.domain ? { domain: target.domain } : {}),
      ...(target.sameSite ? { sameSite: target.sameSite } : {}),
      ...(typeof target.secure === "boolean" ? { secure: target.secure } : {}),
    })
  }
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    /** `lax` matches auth cookie — `strict` omits cookie on many real navigations and breaks checkout after refresh. */
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
    path: "/",
  })
}
