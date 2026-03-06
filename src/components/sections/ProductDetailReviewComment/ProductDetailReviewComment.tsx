"use client"

import {
  getProductReviews,
  type ProductReview,
  type ReviewMeta,
} from "@/lib/data/reviews"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  ProductDetailReviewPagination,
  ProductDetailReviewUserComment,
} from "@/components/sections"

type ProductDetailReviewCommentProps = {
  productId: string
}

// Define how many reviews to display per page
const DISPLAY_LIMIT = 5

export const ProductDetailReviewComment = ({
  productId,
}: ProductDetailReviewCommentProps) => {
  const searchParams = useSearchParams()

  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [meta, setMeta] = useState<ReviewMeta | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const prf = searchParams.get("prf")
  const pageParam = searchParams.get("page")
  const page = pageParam ? parseInt(pageParam, 10) : 1

  // Parse rating filter: if prf is 1-5, use it as rating; if "wi" or "oc", no rating filter
  const rating =
    prf && ["1", "2", "3", "4", "5"].includes(prf)
      ? parseInt(prf, 10)
      : undefined

  // Parse image filter: "wi" = with images only
  const has_image = prf === "wi" ? true : prf === "oc" ? false : undefined

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getProductReviews(productId, {
        rating,
        has_image,
        page,
        limit: DISPLAY_LIMIT,
      })

      //   {
      //     "reviews": [
      //         {
      //             "id": "01KJZAHWNJ20EG7SMA96W5SRN0",
      //             "product_id": "prod_01KH6W31A0MMREZG8HJJE9N6Z3",
      //             "customer_id": "cus_01KH6X6HA9R6BGZ7SMDPDVP7HG",
      //             "order_id": "order_01KJTDQSJEJDBXE9E4BSSJJ652",
      //             "rating": 3,
      //             "comment": "",
      //             "images": null,
      //             "is_verified_purchase": false,
      //             "created_at": "2026-03-05T15:41:09.170Z",
      //             "updated_at": "2026-03-05T15:41:09.170Z",
      //             "deleted_at": null,
      //             "customer": null
      //         }
      //     ],
      //     "meta": {
      //         "page": 1,
      //         "limit": 5,
      //         "count": 1,
      //         "total": 1,
      //         "max_page": 1
      //     }
      // }
      console.log({ data })

      setReviews(data.reviews)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reviews")
    } finally {
      setIsLoading(false)
    }
  }, [productId, rating, has_image, page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  if (error) {
    return (
      <div className="sop-body-md-regular text-sop-system-error-400 text-center py-8">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-7">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          กำลังโหลดรีวิว...
        </div>
      ) : null}
      {reviews.length > 0 ? (
        reviews.map((review) => {
          return (
            <ProductDetailReviewUserComment key={review.id} review={review} />
          )
        })
      ) : (
        <div className="text-center py-2 sop-body-md-regular text-sop-neutral-gray-400">
          ยังไม่มีรีวิวสำหรับสินค้านี้
        </div>
      )}
      <ProductDetailReviewPagination
        meta={
          meta
            ? meta
            : {
                page: 1,
                max_page: 1,
                count: 0,
                limit: DISPLAY_LIMIT,
                total: 0,
              }
        }
      />
    </div>
  )
}
