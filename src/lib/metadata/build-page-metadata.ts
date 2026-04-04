import type { Metadata } from "next"
import { DEFAULT_SITE_NAME } from "@/lib/site-defaults"

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME

export type BuildPageMetadataOptions = {
  locale: string
  /** Path after locale (no leading slash), e.g. "cart" or "collections/dog-food" */
  pathname: string
  title: string
  description: string
  indexable?: boolean
  openGraphType?: "website" | "article"
}

/**
 * Locale-aware SEO metadata. Canonical and Open Graph URLs are path-only;
 * they resolve against `metadataBase` from the root layout.
 */
export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const {
    locale,
    pathname,
    title,
    description,
    indexable = true,
    openGraphType = "website",
  } = options

  const path = pathname.replace(/^\/+/, "")
  const canonicalPath = `/${locale}/${path}`

  return {
    title,
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: canonicalPath,
      siteName,
      type: openGraphType,
    },
  }
}
