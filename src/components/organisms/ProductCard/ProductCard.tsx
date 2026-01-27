"use client"

import {
  ProductCardReviewStars,
  ProductCardShowPrice,
} from "@/components/sections"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { BaseHit, Hit } from "instantsearch.js"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ProductWithSeller } from "@/lib/data/products"

type ProductCardProps = {
  product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>
  api_product?: ProductWithSeller | HttpTypes.StoreProduct | null
}
export const ProductCard = ({ product, api_product }: ProductCardProps) => {
  const productName = String(product.title || "Product")

  if (!api_product) {
    return null
  }

  const averageRating = Number(
    (api_product as ProductWithSeller)?.average_rating ?? 0
  )
  const totalReviews = Number(
    (api_product as ProductWithSeller)?.review_count ?? 0
  )
  const soldCount = Number((api_product as ProductWithSeller)?.sold_count ?? 0)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      aria-label={`View ${productName}`}
      title={`View ${productName}`}
    >
      <div className="md:w-[223px] w-[168px] md:max-w-[223px] max-w-[168px] md:rounded-sop-24px rounded-sop-16px overflow-hidden bg-sop-base-white">
        <div className="md:w-[223px] w-[168px] md:h-[223px] h-[168px]">
          {product.thumbnail ? (
            <Image
              fetchPriority={"auto"}
              src={decodeURIComponent(product.thumbnail)}
              alt="Product image"
              width={223}
              height={223}
              quality={85}
              className="w-full h-auto aspect-square object-cover object-center pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex justify-center items-center bg-sop-additionalblue-300">
              <p className="md:sop-body-sm-regular sop-body-xs-regular text-sop-base-white line-clamp-2 h-sop-40px">
                No image
              </p>
            </div>
          )}
        </div>
        <div className="py-2 md:px-3 px-2 pb-5 flex flex-col gap-1">
          <p className="sop-body-sm-regular text-sop-neutral-gray-300 line-clamp-2 h-sop-40px">
            {product.title}
          </p>
          <ProductCardShowPrice product={api_product || product} />
          <div>
            <ProductCardReviewStars
              starCounts={[]}
              averageRating={averageRating}
              totalReviews={totalReviews}
              soldCount={soldCount}
            />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
