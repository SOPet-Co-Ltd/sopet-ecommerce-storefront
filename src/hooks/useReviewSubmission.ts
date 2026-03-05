"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitProductReviews, uploadReviewImages } from "@/lib/data/reviews"
import { toast } from "@/lib/helpers/toast"
import { REVIEW_MESSAGES } from "@/const/review-messages"

interface ReviewData {
  productId: string
  rating: number
  comment: string
  images?: File[]
}

/**
 * Hook to handle product review submission with proper error handling
 * Handles file conversion, server submission, and toast notifications
 */
export function useReviewSubmission() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submitReviews = async (
    reviewsData: ReviewData[],
    orderId: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Upload images to R2 and collect URLs
      const convertedReviews = await Promise.all(
        reviewsData.map(async (review) => {
          let imageUrls: string[] | undefined

          if (review.images && review.images.length > 0) {
            try {
              imageUrls = await uploadReviewImages(
                review.images,
                review.productId
              )
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "Failed to upload images"
              toast.error({
                title: REVIEW_MESSAGES.ERROR.FILE_UPLOAD,
                description: errorMsg,
              })
              throw err
            }
          }

          return {
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            images: imageUrls,
            order_id: orderId,
          }
        })
      )

      // Submit reviews to server
      const result = await submitProductReviews(convertedReviews)

      if (result.success) {
        const failedCount = result.results.filter((r) => !r.success).length
        const successCount = result.results.filter((r) => r.success).length

        if (failedCount === 0) {
          toast.success({
            title: REVIEW_MESSAGES.SUCCESS.ALL(successCount),
          })
        } else {
          toast.error({
            title: REVIEW_MESSAGES.SUCCESS.PARTIAL(successCount, failedCount),
          })
        }

        router.refresh()
        return true
      } else {
        toast.error({
          title: REVIEW_MESSAGES.ERROR.SUBMIT_FAILED,
        })
        setError(REVIEW_MESSAGES.ERROR.SUBMIT_FAILED)
        return false
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error({
        title: REVIEW_MESSAGES.ERROR.UNEXPECTED(message),
      })
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { submitReviews, isLoading, error }
}
