"use client"

import { Star } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  disabled?: boolean
  className?: string
}

export const StarRating = ({
  rating,
  onRatingChange,
  disabled = false,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating)
        const isHovered = star <= hoverRating

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            className={cn(
              "focus:outline-none transition-colors",
              disabled ? "cursor-default" : "cursor-pointer"
            )}
          >
            <Star
              className={cn(
                "w-8 h-8 transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300",
                !disabled && "hover:scale-110 duration-200"
              )}
              strokeWidth={1.5}
            />
          </button>
        )
      })}
    </div>
  )
}
