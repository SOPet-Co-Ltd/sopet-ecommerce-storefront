import type { MetadataRoute } from "next"
import { sdk } from "@/lib/config"
import { listCollections } from "@/lib/data/collections"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { getRegion, listRegions } from "@/lib/data/regions"
import { REVALIDATE_REGIONS } from "@/lib/cache/constants"
import { getPublicSiteUrl, DEFAULT_REGION } from "@/lib/site-defaults"

/** Cap product list API pages per locale to bound build/runtime cost; raise or add generateSitemaps if the catalog outgrows this. */
const MAX_PRODUCT_PAGES_PER_LOCALE = 60
const PRODUCT_PAGE_SIZE = 100

const STATIC_PATHS = [
  "",
  "categories",
  "coupons",
  "search",
  "vet-ai",
  "policy/privacy-policy",
  "policy/refund-policy",
  "policy/terms-of-service",
] as const

async function resolveLocales(): Promise<string[]> {
  try {
    const regions = await listRegions()
    const codes = new Set<string>()
    for (const r of regions ?? []) {
      for (const c of r.countries ?? []) {
        if (c?.iso_2) codes.add(c.iso_2.toLowerCase())
      }
    }
    if (codes.size > 0) return [...codes].sort()
  } catch {
    /* fallback below */
  }
  return [DEFAULT_REGION.toLowerCase()]
}

async function fetchCategoryRows(): Promise<
  { handle: string; updated_at?: string }[]
> {
  try {
    const next = {
      ...(await getCacheOptions("product-categories")),
      revalidate: REVALIDATE_REGIONS,
    }
    const { product_categories } = await sdk.client.fetch<{
      product_categories: { handle?: string; updated_at?: string }[]
    }>("/store/product-categories", {
      method: "GET",
      query: {
        limit: "500",
        fields: "handle,updated_at",
      },
      cache: "force-cache",
      next,
    })
    return (product_categories ?? []).filter(
      (c): c is { handle: string; updated_at?: string } => Boolean(c.handle)
    )
  } catch {
    return []
  }
}

type SitemapProductRow = {
  handle?: string
  updated_at?: string
  metadata?: Record<string, unknown>
  seller?: { store_status?: string }
}

async function productEntriesForLocale(
  loc: string,
  base: string
): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = []
  const region = await getRegion(loc)
  if (!region?.id) return out

  const headers = await getAuthHeaders()
  let offset = 0
  let pages = 0

  while (pages < MAX_PRODUCT_PAGES_PER_LOCALE) {
    try {
      const { products, count } = await sdk.client.fetch<{
        products: SitemapProductRow[]
        count: number
      }>(`/store/products`, {
        method: "GET",
        query: {
          region_id: region.id,
          country_code: loc,
          limit: String(PRODUCT_PAGE_SIZE),
          offset: String(offset),
          fields: "handle,updated_at,+metadata,*seller",
        },
        headers,
        cache: "no-store",
      })

      const bypassPublishedToAlgoliaInDev = process.env.NODE_ENV === "development"
      const rows = products ?? []
      for (const p of rows) {
        if (
          !p.handle ||
          p.seller?.store_status === "SUSPENDED" ||
          (!bypassPublishedToAlgoliaInDev && p.metadata?.published_to_algolia !== true)
        ) {
          continue
        }
        out.push({
          url: `${base}/${loc}/products/${p.handle}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
          changeFrequency: "weekly",
          priority: 0.6,
        })
      }

      offset += PRODUCT_PAGE_SIZE
      pages += 1
      if (offset >= (count ?? 0)) break
    } catch {
      break
    }
  }

  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicSiteUrl()
  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []

  const push = (item: MetadataRoute.Sitemap[number]) => {
    if (seen.has(item.url)) return
    seen.add(item.url)
    entries.push(item)
  }

  let locales: string[] = []
  try {
    locales = await resolveLocales()
  } catch {
    locales = [DEFAULT_REGION.toLowerCase()]
  }

  let collectionHandles: string[] = []
  try {
    const { collections } = await listCollections()
    collectionHandles = (collections ?? [])
      .map((c) => c.handle)
      .filter((h): h is string => Boolean(h))
  } catch {
    /* static-only fallback */
  }

  let categoryRows: { handle: string; updated_at?: string }[] = []
  try {
    categoryRows = await fetchCategoryRows()
  } catch {
    /* ignore */
  }

  for (const loc of locales) {
    for (const segment of STATIC_PATHS) {
      const path = segment ? `/${loc}/${segment}` : `/${loc}`
      push({
        url: `${base}${path}`,
        changeFrequency: segment === "" ? "daily" : "weekly",
        priority: segment === "" ? 1 : 0.8,
      })
    }

    for (const handle of collectionHandles) {
      push({
        url: `${base}/${loc}/collections/${handle}`,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const cat of categoryRows) {
      push({
        url: `${base}/${loc}/categories/${cat.handle}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    try {
      const productRows = await productEntriesForLocale(loc, base)
      for (const row of productRows) push(row)
    } catch {
      /* keep sitemap valid */
    }
  }

  return entries
}
