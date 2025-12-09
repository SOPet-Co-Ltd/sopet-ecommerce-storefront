"use client"

import { useState, useEffect } from "react"
import {
  ProductCardReviewStars,
  ProductCardShowPrice,
} from "@/components/sections"
import { getProductReviewStats, ReviewStats } from "@/lib/data/reviews"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { BaseHit, Hit } from "instantsearch.js"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

type ProductCardProps = {
  product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>
  api_product?: HttpTypes.StoreProduct | null
}
export const ProductCard = ({ product, api_product }: ProductCardProps) => {
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const productId = product.id || api_product?.id
  const productName = String(product.title || "Product")

  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!productId) {
        setIsLoading(false)
        return
      }

      try {
        const stats = await getProductReviewStats(productId.toString())
        setReviewStats(stats)
      } catch (error) {
        console.error("Failed to fetch review stats:", error)
        setReviewStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviewStats()
  }, [productId])

  if (!api_product) {
    return null
  }

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      aria-label={`View ${productName}`}
      title={`View ${productName}`}
    >
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
          <ProductCardShowPrice product={api_product || product} />
          <div>
            <ProductCardReviewStars
              starCounts={
                (!isLoading && reviewStats && reviewStats.starCounts) || []
              }
              averageRating={
                (!isLoading && reviewStats && reviewStats.averageRating) || 0
              }
              totalReviews={
                (!isLoading && reviewStats && reviewStats.totalReviews) || 0
              }
            />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
