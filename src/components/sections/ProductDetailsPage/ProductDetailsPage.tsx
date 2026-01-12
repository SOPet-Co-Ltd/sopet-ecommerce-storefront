import { ProductDetails, ProductGallery } from "@/components/organisms"
import { listProducts } from "@/lib/data/products"
import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductDetailsSeller } from "@/components/cells"
import {
  ProductDetailDescription,
  HomeProductSection,
  ProductDetailReview,
  ProductDetailWarning,
} from ".."
import { Suspense } from "react"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
    forceCache: true,
  }).then(({ response }) => response.products[0])

  // TODO - return NotFound page if product is not found
  if (!prod) return NotFound()

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
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

  const productWarning: string | null = (prod as any).attribute_values?.find(
    (attr: any) => attr?.attribute?.handle === "product_warning"
  )?.value ?? null

  return (
    <>
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

      <ProductDetailReview productId={prod.id} />

      <div className="my-8">
        <Suspense fallback={<div>กำลังโหลดสินค้าเพิ่มเติมจากผู้ขาย...</div>}>
          <HomeProductSection
            heading="สินค้าจากร้านเดียวกัน"
            sellerProducts={prod.seller?.products}
            locale={locale}
          />
        </Suspense>
      </div>
    </>
  )
}
