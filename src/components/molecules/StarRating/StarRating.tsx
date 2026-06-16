"use client"

import { Star } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ReviewStarIcon, StarIcon } from "@/icons"

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

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (disabled) return

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault()
        if (star < 5) {
          onRatingChange(star + 1)
        }
        break
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault()
        if (star > 1) {
          onRatingChange(star - 1)
        }
        break
      case "Home":
        e.preventDefault()
        onRatingChange(1)
        break
      case "End":
        e.preventDefault()
        onRatingChange(5)
        break
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="ให้คะแนน"
      aria-required="true"
      className={cn("flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating)
        const isChecked = star === rating

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={isChecked}
            aria-label={`${star} ดาว`}
            disabled={disabled}
            onClick={() => onRatingChange(star)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            tabIndex={isChecked ? 0 : -1}
            className={cn(
              "focus:outline-none focus:ring-2 focus:ring-sop-primary-500 focus:ring-offset-2 rounded transition-colors",
              disabled ? "cursor-default" : "cursor-pointer"
            )}
          >
            <ReviewStarIcon filled={isFilled} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
