import type { Metadata } from "next"

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "SOPet"

export function buildPolicyPageMetadata(options: {
  locale: string
  pathSegment: string
  title: string
  description: string
}): Metadata {
  const { locale, pathSegment, title, description } = options
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ).replace(/\/$/, "")
  const path = `/${locale}/policy/${pathSegment}`
  const canonical = `${base}${path}`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [{ url: `${base}/images/logo.png` }],
    },
  }
}
