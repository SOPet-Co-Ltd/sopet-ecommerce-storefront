import { ProductDetails, ProductGallery } from "@/components/organisms"
import { getProductByHandleForPdp } from "@/lib/data/product-pdp"
import { Breadcrumbs } from "@/components/atoms"
import { ProductDetailsSeller } from "@/components/cells"
import {
  ProductDetailDescription,
  HomeProductSection,
  ProductDetailReview,
  ProductDetailWarning,
} from ".."
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ProductDetailsCacheHydrator } from "./ProductDetailsCacheHydrator"
import { ProductViewTracker } from "@/components/atoms/ProductViewTracker/ProductViewTracker"
import { ProductDetailReviewSkeleton } from "./ProductDetailReviewSkeleton"
import { SellerProductsSectionSkeleton } from "./SellerProductsSectionSkeleton"

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
      <ProductViewTracker productId={prod.id} />
      <ProductDetailsCacheHydrator product={prod} locale={locale} />
      {/* Section - Breadcrumb */}
      <div className="py-4 lg:block hidden">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="bg-sop-base-white grid lg:grid-cols-[4fr_6fr] grid-cols-1 gap-4 lg:p-4 lg:rounded-lg rounded-none pb-4">
        <ProductGallery images={prod?.images || []} />
        <ProductDetails product={prod} locale={locale} />
      </div>

      <ProductDetailsSeller seller={prod?.seller} />

      <ProductDetailDescription description={prod.description} />

      <ProductDetailWarning warning={productWarning} />

      <Suspense fallback={<ProductDetailReviewSkeleton />}>
        <ProductDetailReview productId={prod.id} />
      </Suspense>

      <Suspense fallback={<SellerProductsSectionSkeleton />}>
        <HomeProductSection
          heading="สินค้าจากร้านเดียวกัน"
          sellerProducts={prod.seller?.products}
          locale={locale}
          excludeProductId={prod.id}
        />
      </Suspense>
    </>
  )
}
