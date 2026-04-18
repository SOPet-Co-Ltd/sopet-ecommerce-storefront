"use client"

import { Button } from "@/components/atoms/Button/Button"
import { useState, useMemo } from "react"
import { StarRating } from "@/components/molecules/StarRating/StarRating"
import { PhotoUpload } from "@/components/molecules/PhotoUpload/PhotoUpload"
import { SmartImage } from "@/components/atoms"
import type { OrderLineItem } from "@/types/order"

interface ReviewFormData {
  productId: string
  itemId: string
  rating: number
  comment: string
  images: File[]
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  items: OrderLineItem[]
  onSubmit: (
    data: Array<{
      productId: string
      rating: number
      comment: string
      images: File[]
    }>
  ) => Promise<void>
}

export const ReviewModal = ({
  isOpen,
  onClose,
  items,
  onSubmit,
}: ReviewModalProps) => {
  // Initialize review data for each item
  const initialReviewData = useMemo<ReviewFormData[]>(
    () =>
      items
        .filter(
          (
            item
          ): item is OrderLineItem & {
            product: NonNullable<OrderLineItem["product"]>
          } => Boolean(item.product?.id)
        )
        .map((item) => ({
          productId: item.product.id,
          itemId: item.id,
          rating: 0,
          comment: "",
          images: [],
        })),
    [items]
  )

  const [reviewData, setReviewData] =
    useState<ReviewFormData[]>(initialReviewData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update specific item's review data
  const updateItemReview = (
    itemId: string,
    field: keyof Omit<ReviewFormData, "itemId">,
    value: unknown
  ) => {
    setReviewData((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, [field]: value } : item
      )
    )
    // Clear validation error when user updates a field
    if (error && field === "rating") {
      setError(null)
    }
  }

  const allItemsRated = reviewData.every((item) => item.rating > 0)

  const handleSubmit = async () => {
    // Validate all items have ratings
    if (!allItemsRated) {
      setError("กรุณาให้คะแนนสำหรับสินค้าทั้งหมด")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const submitData = reviewData.map((item) => ({
        productId: item.productId,
        rating: item.rating,
        comment: item.comment,
        images: item.images,
      }))
      await onSubmit(submitData)
      setReviewData(initialReviewData)
      onClose()
    } catch (error) {
      console.error("Failed to submit reviews:", error)
      setError(error instanceof Error ? error.message : "ล้มเหลวในการส่งรีวิว")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-175.25 bg-sop-base-white rounded-sop-20px px-4 py-5 gap-5 shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-sop-neutral-grayalpha-300">
          <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
            รีวิวสินค้า
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-sop-12px bg-red-50 border border-red-200 flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              <svg
                className="w-5 h-5 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="sop-body-sm-regular text-red-600">{error}</p>
          </div>
        )}

        {/* Items Review Section */}
        <div className="space-y-6 max-h-[calc(90vh-280px)] overflow-y-auto">
          {items.map((item) => {
            const itemReview = reviewData.find((r) => r.itemId === item.id)
            if (!itemReview) return null

            return (
              <div
                key={item.id}
                className="flex flex-col gap-5 pb-6 border-b border-sop-neutral-grayalpha-300 last:border-b-0"
              >
                {/* Product Info */}
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 shrink-0 bg-sop-neutral-gray-500 rounded-sop-8px overflow-hidden">
                    {item.thumbnail ? (
                      <SmartImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-sop-neutral-gray-400">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <p className="sop-body-md-medium text-sop-neutral-gray-300 line-clamp-2">
                      {item.title}
                    </p>
                    {item.variant?.title && (
                      <p className="sop-body-sm-regular text-sop-neutral-gray-400 line-clamp-1">
                        ตัวเลือก: {item.variant.title}
                      </p>
                    )}
                    <p className="sop-body-md-semibold text-sop-neutral-gray-300">
                      ฿{item.unit_price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="flex items-center gap-4">
                  <span className="text-sop-primary-500 sop-body-md-semibold whitespace-nowrap">
                    ให้คะแนน
                  </span>
                  <StarRating
                    rating={itemReview.rating}
                    onRatingChange={(rating) =>
                      updateItemReview(item.id, "rating", rating)
                    }
                  />
                </div>

                {/* Photo Upload */}
                <div className="flex flex-col">
                  <PhotoUpload
                    images={itemReview.images}
                    onImagesChange={(images) =>
                      updateItemReview(item.id, "images", images)
                    }
                  />
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-2">
                  <label className="sop-body-sm-medium text-sop-neutral-gray-300">
                    ความเห็นของคุณ
                  </label>
                  <textarea
                    value={itemReview.comment}
                    onChange={(e) =>
                      updateItemReview(item.id, "comment", e.target.value)
                    }
                    placeholder="แบ่งปันประสบการณ์ของคุณหลังจากได้รับหรือใช้สินค้า"
                    className="w-full h-24 py-2 px-3 rounded-sop-12px border border-sop-neutral-gray-500 bg-sop-neutral-gray-500 placeholder:text-sop-neutral-gray-400 text-sop-neutral-gray-200 focus:outline-none focus:ring-2 focus:ring-sop-primary-500 focus:border-transparent resize-none sop-body-sm-regular"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end items-center pt-2.5 border-t border-sop-neutral-grayalpha-300">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !allItemsRated}
          >
            {isSubmitting ? "กำลังส่ง..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  )
}
