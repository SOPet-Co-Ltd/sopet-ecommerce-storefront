import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { headers } from "next/headers"

export const generateProductMetadata = async (
  product: HttpTypes.StoreProduct
): Promise<Metadata> => {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const thumb = product?.thumbnail

  const openGraph: Metadata["openGraph"] = {
    title: product?.title,
    description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
    url: `${protocol}://${host}/products/${product?.handle}`,
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
    metadataBase: new URL(`${protocol}://${host}/products/${product?.handle}`),
    openGraph,
    twitter,
  }
}

export const generateCategoryMetadata = async (
  category: HttpTypes.StoreProductCategory
) => {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"

  return {
    robots: "index, follow",
    metadataBase: new URL(
      `${protocol}://${host}/categories/${category.handle}`
    ),
    title: `${category.name} Category`,
    description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,

    openGraph: {
      title: category.name,
      description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      url: `${protocol}://${host}/categories/${category.handle}`,
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
