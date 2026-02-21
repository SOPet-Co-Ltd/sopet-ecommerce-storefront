"use client"

import { Button } from "@/components/atoms"
import { X } from "lucide-react"
import { useState } from "react"
import { StarRating } from "@/components/molecules/StarRating/StarRating"
import { PhotoUpload } from "@/components/molecules/PhotoUpload/PhotoUpload"
import Image from "next/image"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productImage?: string | null
  productVariant?: string
  productPrice?: string
  onSubmit: (data: {
    rating: number
    comment: string
    images: File[]
  }) => Promise<void>
}

export const ReviewModal = ({
  isOpen,
  onClose,
  productName,
  productImage,
  productVariant,
  productPrice,
  onSubmit,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({ rating, comment, images })
      onClose()
      // Reset form
      setComment("")
      setImages([])
      setRating(0)
    } catch (error) {
      console.error("Failed to submit review:", error)
      alert("เกิดข้อผิดพลาดในการส่งรีวิว")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-[600px] bg-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">รีวิวสินค้า</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Rating Section */}
        <div className="flex items-center gap-4">
          <span className="text-sop-primary-500 font-bold text-base">
            ให้คะแนน
          </span>
          <StarRating rating={rating} onRatingChange={setRating} />
        </div>

        {/* Product Info */}
        <div className="flex gap-4">
          <div className="relative w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
            {productImage ? (
              <Image
                src={productImage}
                alt={productName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <p className="sop-body-md-medium text-gray-900 line-clamp-1">
              {productName}
            </p>
            {productVariant && (
              <p className="text-gray-500 sop-body-md-regular">
                ตัวเลือกสินค้า : {productVariant}
              </p>
            )}
            {productPrice && (
              <p className="sop-body-md-medium text-gray-900">{productPrice}</p>
            )}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="min-h-[100px] flex flex-col justify-center">
          <PhotoUpload images={images} onImagesChange={setImages} />
        </div>

        {/* Comment */}
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="รีวิวประสบการณ์ของคุณ หลังจากที่ได้รับหรือใช้สินค้าแล้ว"
            className="w-full min-h-[120px] p-4 rounded-xl bg-gray-50 border-none focus:ring-1 focus:ring-sop-primary-500 resize-none text-gray-700 placeholder:text-gray-400 text-base"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-2">
          <Button
            variant="outline"
            className="rounded-full px-8 py-2.5 h-auto border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-primary-50 hover:border-sop-secondary-300 font-medium"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button
            className="rounded-full px-8 py-2.5 h-auto bg-sop-primary-500 text-base hover:bg-sop-primary-300 font-medium"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังส่ง..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  )
}
