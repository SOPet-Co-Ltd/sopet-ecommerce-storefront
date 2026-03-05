"use client"

import { ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { SmartImage } from "@/components/atoms"

interface PhotoUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  className?: string
}

export const PhotoUpload = ({
  images,
  onImagesChange,
  maxImages = 5,
  className,
}: PhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Filter only images
    const newImages = files.filter((file) => file.type.startsWith("image/"))

    // Combine with current images but obey max limit
    const combinedImages = [...images, ...newImages].slice(0, maxImages)

    onImagesChange(combinedImages)

    // Reset input
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onImagesChange(newImages)
  }

  return (
    <div className={cn("flex  flex-wrap gap-5", className)}>
      {/* Upload Button */}
      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-26 h-20.25 rounded-sop-4px border-2 border-dashed border-sop-neutral-gray-400 flex flex-col items-center justify-center cursor-pointer"
        >
          <ImagePlus
            className="w-8 h-8 text-sop-neutral-gray-400"
            strokeWidth={1}
          />
          <span className="sop-body-sm-regular text-sop-neutral-gray-400">
            เพิ่มรูปภาพ
          </span>
        </button>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Existing Images Preview */}
      {images.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="relative w-26 h-20.25 rounded-sop-4px overflow-hidden group"
        >
          <SmartImage
            src={URL.createObjectURL(file)}
            alt={`Preview ${index}`}
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => removeImage(index)}
            className="absolute cursor-pointer top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
