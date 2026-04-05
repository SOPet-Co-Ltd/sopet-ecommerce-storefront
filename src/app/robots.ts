import { getPublicSiteUrl } from "@/lib/site-defaults"
import type { MetadataRoute } from "next"

/**
 * Locale-first paths: first segment is `[locale]` (e.g. /th/cart).
 * We avoid disallowing /user entirely so /{locale}/user/register can stay crawlable.
 * Login is disallowed here to match noindex auth metadata; transactional paths reduce crawler noise.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/checkout",
          "/*/cart",
          "/*/order/",
          "/*/reset-password",
          "/*/auth/",
          "/*/login",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
