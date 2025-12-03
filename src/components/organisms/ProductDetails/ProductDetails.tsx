import {
  ProductDetailsFooter,
  ProductDetailsHeader,
  ProductDetailsSeller,
  ProductDetailsShipping,
  ProductPageDetails,
  ProductAdditionalAttributes,
} from "@/components/cells"
import { ProductDetailsVariantSelection } from "@/components/cells/ProductDetailsVariantSelection/ProductDetailsVariantSelection"
import ProductReviewStars from "@/components/sections/ProductReview/ProductReview"
import { ProductShowPrice } from "@/components/sections/ProductShowPrice/ProductShowPrice"
import { ClipboardAddIcon, LinkIcon, SaleIcon, ShieldCheckIcon } from "@/icons"

import { retrieveCustomer } from "@/lib/data/customer"
import { getProductReviewStats } from "@/lib/data/reviews"
import { getUserWishlists } from "@/lib/data/wishlist"
import { AdditionalAttributeProps } from "@/types/product"
import { SellerProps } from "@/types/seller"
import { Wishlist } from "@/types/wishlist"
import { HttpTypes } from "@medusajs/types"

export const ProductDetails = async ({
  product,
  locale,
}: {
  product: HttpTypes.StoreProduct & {
    seller?: SellerProps
    attribute_values?: AdditionalAttributeProps[]
  }
  locale: string
}) => {
  const user = await retrieveCustomer()

  let wishlist: Wishlist[] = []
  if (user) {
    const response = await getUserWishlists()
    wishlist = response.wishlists
  }

  const reviewStats = await getProductReviewStats(product.id)

  return (
    <div className="flex flex-col px-4 gap-6">
      {/* Section title */}
      <p className="md:sop-headline-md-medium sop-body-lg-medium text-sop-neutral-gray-300">
        {product.title}
      </p>
      <ProductReviewStars
        starCounts={reviewStats.starCounts}
        averageRating={reviewStats.averageRating}
        totalReviews={reviewStats.totalReviews}
      />
      <ProductShowPrice product={product} />

      <ProductDetailsVariantSelection
        product={product}
        locale={locale}
        user={user}
        wishlist={wishlist}
      />

      {/* Section Product Rating */}
      {/* 
      <ProductDetailsHeader
        product={product}
        locale={locale}
        user={user}
        wishlist={wishlist}
      /> */}

      {/* <ProductPageDetails details={product?.description || ""} /> */}
      {/* <ProductAdditionalAttributes
        attributes={product?.attribute_values || []}
      /> */}
      {/* <ProductDetailsShipping /> */}
      {/* <ProductDetailsSeller seller={product?.seller} /> */}
      {/* <ProductDetailsFooter`
        tags={product?.tags || []}
        posted={product?.created_at}
      /> */}
    </div>
  )
}
