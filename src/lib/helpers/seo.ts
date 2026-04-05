import { getRequestBaseUrl } from "@/lib/helpers/request-base-url"
import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { headers } from "next/headers"

export const generateProductMetadata = async (
  product: HttpTypes.StoreProduct,
  locale: string
): Promise<Metadata> => {
  const headersList = await headers()
  const baseUrl = getRequestBaseUrl(
    headersList,
    process.env.NEXT_PUBLIC_BASE_URL
  )
  const canonicalUrl = `${baseUrl}/${locale}/products/${product.handle}`
  const thumb = product?.thumbnail

  const openGraph: Metadata["openGraph"] = {
    title: product?.title,
    description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
    url: canonicalUrl,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    type: "website",
  }

  if (thumb) {
    openGraph.images = [
      {
        url: thumb,
        width: 1200,
        height: 630,
        alt: product?.title,
      },
    ]
  }

  const twitter: Metadata["twitter"] = {
    card: "summary_large_image",
    title: product?.title,
    description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
  }

  if (thumb) {
    twitter.images = [thumb]
  }

  return {
    title: product?.title,
    description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
    robots: "index, follow",
    metadataBase: new URL(baseUrl),
    alternates: { canonical: canonicalUrl },
    openGraph,
    twitter,
  }
}

export const generateCategoryMetadata = async (
  category: HttpTypes.StoreProductCategory,
  locale: string
) => {
  const headersList = await headers()
  const baseUrl = getRequestBaseUrl(
    headersList,
    process.env.NEXT_PUBLIC_BASE_URL
  )
  const canonicalUrl = `${baseUrl}/${locale}/categories/${category.handle}`

  return {
    robots: "index, follow",
    metadataBase: new URL(baseUrl),
    alternates: { canonical: canonicalUrl },
    title: `${category.name} Category`,
    description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,

    openGraph: {
      title: category.name,
      description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      url: canonicalUrl,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
    },
  }
}
