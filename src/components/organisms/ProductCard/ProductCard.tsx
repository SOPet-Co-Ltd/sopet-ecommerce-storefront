import {
  ProductCardReviewStars,
  ProductCardShowPrice,
} from "@/components/sections"
import { getProductReviewStats } from "@/lib/data/reviews"
import { Product } from "@/types/product"
import { StoreProduct } from "@medusajs/types"
import Image from "next/image"

type ProductCardProps = {
  product: StoreProduct
}

export const ProductCard = async ({ product }: ProductCardProps) => {
  const productReviewStars = await getProductReviewStats(product.id.toString())
  console.log(productReviewStars)
  return (
    <div className="md:w-[223px] w-[168px] md:rounded-sop-24px rounded-sop-16px overflow-hidden bg-sop-base-white">
      <div className="md:w-[223px] w-[168px] md:h-[223px] h-[168px]">
        <Image
          fetchPriority={"auto"}
          src={decodeURIComponent(
            product.images?.[0]?.url || "/images/product/placeholder.jpg"
          )}
          alt="Product image"
          width={223}
          height={223}
          quality={85}
          className="w-full h-auto aspect-square object-cover object-center pointer-events-none select-none"
          draggable={false}
        />
      </div>
      <div className="py-2 md:px-3 px-2 pb-5 flex flex-col gap-1">
        <p>{product.title}</p>
        <ProductCardShowPrice product={product} />
        <div>
          <ProductCardReviewStars
            starCounts={productReviewStars.starCounts}
            averageRating={productReviewStars.averageRating}
            totalReviews={productReviewStars.totalReviews}
          />
        </div>
      </div>
    </div>
  )
}
