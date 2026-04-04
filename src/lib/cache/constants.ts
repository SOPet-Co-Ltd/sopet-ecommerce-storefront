/**
 * Next.js fetch `revalidate` windows (seconds) and public cache tags for `revalidateTag`.
 * Route files cannot import these for `export const revalidate` (Next requires a numeric literal);
 * keep product and categories `page.tsx` files' `revalidate = 60` in sync with REVALIDATE_PRODUCT_LIST.
 */

export const REVALIDATE_PRODUCT_LIST = 60 as const
export const REVALIDATE_STOREFRONT = 60 as const
export const REVALIDATE_REGIONS = 3600 as const
/** Category tree listing; same hour window as regions / sitemap category index. */
export const REVALIDATE_CATEGORY_LIST = REVALIDATE_REGIONS
/** Single category by handle (navigation); shorter window for name/hierarchy changes. */
export const REVALIDATE_CATEGORY_DETAIL = 300 as const

export const STOREFRONT_BANNERS_TAG = "storefront-banners" as const
export const STOREFRONT_SPONSORS_TAG = "storefront-sponsors" as const

export type StorefrontPublicCacheTag =
  | typeof STOREFRONT_BANNERS_TAG
  | typeof STOREFRONT_SPONSORS_TAG

export const STOREFRONT_PUBLIC_CACHE_TAGS: StorefrontPublicCacheTag[] = [
  STOREFRONT_BANNERS_TAG,
  STOREFRONT_SPONSORS_TAG,
]
