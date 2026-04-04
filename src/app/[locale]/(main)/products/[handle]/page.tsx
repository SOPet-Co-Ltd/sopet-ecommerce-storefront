import { ProductDetailsPage } from "@/components/sections"
import { getProductByHandleForPdp } from "@/lib/data/product-pdp"
import { generateProductMetadata } from "@/lib/helpers/seo"
import type { Metadata } from "next"

/** Must match `REVALIDATE_PRODUCT_LIST` in `@/lib/cache/constants` (Next requires a numeric literal here). */
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const prod = await getProductByHandleForPdp(handle, locale)

  if (!prod) {
    return {
      title: process.env.NEXT_PUBLIC_SITE_NAME ?? "Product",
      robots: { index: false, follow: false },
    }
  }

  return generateProductMetadata(prod, locale)
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  return (
    <main className="lg:px-16 px-0 lg:py-4">
      <ProductDetailsPage handle={handle} locale={locale} />
    </main>
  )
}
