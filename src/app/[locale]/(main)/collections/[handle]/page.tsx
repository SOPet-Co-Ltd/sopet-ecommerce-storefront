import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { getCollectionByHandle } from "@/lib/data/collections"
import { getRegion } from "@/lib/data/regions"
import isBot from "@/lib/helpers/isBot"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { Suspense } from "react"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params
  const collection = await getCollectionByHandle(handle)

  if (!collection) {
    return { title: "ไม่พบคอลเลกชัน" }
  }

  const title = collection.title
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "SOPet"
  const metaDesc = collection.metadata
  const rawDesc =
    metaDesc && typeof metaDesc === "object" && metaDesc !== null
      ? (metaDesc as Record<string, unknown>)["description"]
      : undefined
  const description =
    typeof rawDesc === "string" && rawDesc.trim()
      ? rawDesc.trim()
      : `เลือกซื้อสินค้าในคอลเลกชัน ${title} บน ${site}`

  return buildPageMetadata({
    locale,
    pathname: `collections/${handle}`,
    title,
    description,
    indexable: true,
  })
}

const SingleCollectionsPage = async ({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) => {
  const { handle, locale } = await params

  const bot = isBot(navigator.userAgent)
  const collection = await getCollectionByHandle(handle)

  if (!collection) return <NotFound />

  const currency_code = (await getRegion(locale))?.currency_code || "usd"

  const breadcrumbsItems = [
    {
      path: collection.handle,
      label: collection.title,
    },
  ]

  return (
    <main className="container">
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">{collection.title}</h1>

      <Suspense fallback={<ProductListingSkeleton />}>
        {bot || !ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
          <ProductListing collection_id={collection.id} showSidebar />
        ) : (
          <AlgoliaProductsListing
            collection_id={collection.id}
            locale={locale}
            currency_code={currency_code}
          />
        )}
      </Suspense>
    </main>
  )
}

export default SingleCollectionsPage
