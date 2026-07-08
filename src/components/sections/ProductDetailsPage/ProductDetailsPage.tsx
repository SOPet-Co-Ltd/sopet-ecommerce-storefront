import { ProductDetails } from "@/components/organisms/ProductDetails/ProductDetails"
import { ProductGallery } from "@/components/organisms/ProductGallery/ProductGallery"
import { getProductByHandleForPdp } from "@/lib/data/product-pdp"
import { getProductReviewStats, type ReviewStats } from "@/lib/data/reviews"
import { Breadcrumbs } from "@/components/atoms"
import { ProductDetailsSeller } from "@/components/cells/ProductDetailsSeller/ProductDetailsSeller"
import { HomeProductSection } from "@/components/sections/HomeProductSection/HomeProductSection"
import { ProductDetailDescription } from "@/components/sections/ProductDetailDescription/ProductDetailDescription"
import { ProductDetailReview } from "@/components/sections/ProductDetailReview/ProductDetailReview"
import { ProductDetailWarning } from "@/components/sections/ProductDetailWarning/ProductDetailWarning"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ProductDetailsCacheHydrator } from "./ProductDetailsCacheHydrator"
import { ProductViewTracker } from "@/components/atoms/ProductViewTracker/ProductViewTracker"
import { ProductDetailReviewSkeleton } from "./ProductDetailReviewSkeleton"
import { SellerProductsSectionSkeleton } from "./SellerProductsSectionSkeleton"

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getInitialReviewStats = (product: {
  average_rating?: number | string | null
  review_count?: number | string | null
  sold_count?: number | string | null
}): ReviewStats => ({
  averageRating: toFiniteNumber(product.average_rating),
  totalReviews: toFiniteNumber(product.review_count),
  starCounts: [],
  soldCount: toFiniteNumber(product.sold_count),
})

const ProductDetailReviewWithStats = async ({
  productId,
  reviewStatsPromise,
}: {
  productId: string
  reviewStatsPromise: Promise<ReviewStats>
}) => {
  const reviewStats = await reviewStatsPromise

  return <ProductDetailReview productId={productId} reviewStats={reviewStats} />
}

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await getProductByHandleForPdp(handle, locale)

  if (!prod) notFound()

  if (prod.seller?.store_status === "SUSPENDED") {
    notFound()
  }

  const initialReviewStats = getInitialReviewStats(prod)
  const reviewStatsPromise = getProductReviewStats(prod.id, initialReviewStats)

  const breadcrumbs = !prod.collection
    ? [
        { label: "หน้าแรก", path: "/" },
        { label: prod.title, path: `/products/${prod.handle}` },
      ]
    : [
        { label: "หน้าแรก", path: "/" },
        {
          label: prod.collection.title,
          path: `/collections/${prod.collection.handle}`,
        },
        { label: prod.title, path: `/products/${prod.handle}` },
      ]

  const productWarning: string | null =
    (prod as any).attribute_values?.find(
      (attr: any) => attr?.attribute?.handle === "product_warning"
    )?.value ?? null

  return (
    <>
      <ProductViewTracker productId={prod.id} product={prod} />
      <ProductDetailsCacheHydrator product={prod} locale={locale} />
      {/* Section - Breadcrumb */}
      <div className="py-4 lg:block hidden">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="bg-sop-base-white grid lg:grid-cols-[4fr_6fr] grid-cols-1 gap-4 lg:p-4 lg:rounded-lg rounded-none pb-4">
        <ProductGallery images={prod?.images || []} />
        <ProductDetails
          product={prod}
          locale={locale}
          reviewStats={initialReviewStats}
        />
      </div>

      <ProductDetailsSeller seller={prod?.seller} />

      <ProductDetailDescription description={prod.description} />

      <ProductDetailWarning warning={productWarning} />

      <Suspense fallback={<ProductDetailReviewSkeleton />}>
        <ProductDetailReviewWithStats
          productId={prod.id}
          reviewStatsPromise={reviewStatsPromise}
        />
      </Suspense>

      <Suspense fallback={<SellerProductsSectionSkeleton />}>
        <HomeProductSection
          heading="สินค้าจากร้านเดียวกัน"
          sellerProducts={prod.seller?.products}
          locale={locale}
          excludeProductId={prod.id}
          viewAllHref={`/${locale}/categories`}
        />
      </Suspense>
    </>
  )
}
