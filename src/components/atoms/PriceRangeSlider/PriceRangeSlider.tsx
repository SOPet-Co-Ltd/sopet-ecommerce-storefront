"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { convertToLocale } from "@/lib/helpers/money"

export interface PriceRangeSliderProps {
  min: number
  max: number
  value: { min: number; max: number }
  step?: number
  className?: string
  onRangeChange: (min: number, max: number) => void
  formatValue?: (value: number) => string
  currency_code?: string
  locale?: string
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min: minRange,
  max: maxRange,
  value,
  step = 1,
  className,
  onRangeChange,
  formatValue,
  currency_code,
  locale,
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Sync local state with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const minValue = localValue.min
  const maxValue = localValue.max
  const rangeDiff = maxRange - minRange

  const minPercentage = ((minValue - minRange) / rangeDiff) * 100
  const maxPercentage = ((maxValue - minRange) / rangeDiff) * 100

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!sliderRef.current) return minRange

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      )
      const rawValue = minRange + percentage * rangeDiff
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(minRange, Math.min(maxRange, steppedValue))
    },
    [minRange, maxRange, rangeDiff, step]
  )

  const handleMouseDown = useCallback(
    (type: "min" | "max") => (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(type)
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const newValue = getValueFromPosition(e.clientX)

      if (isDragging === "min") {
        const clampedValue = Math.min(newValue, maxValue - step)
        setLocalValue({ min: clampedValue, max: maxValue })
      } else {
        const clampedValue = Math.max(newValue, minValue + step)
        setLocalValue({ min: minValue, max: clampedValue })
      }
    },
    [isDragging, getValueFromPosition, minValue, maxValue, step]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onRangeChange(minValue, maxValue)
    }
    setIsDragging(null)
  }, [isDragging, minValue, maxValue, onRangeChange])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const defaultFormatValue = useCallback(
    (val: number): string => {
      if (currency_code) {
        return convertToLocale({
          amount: val,
          currency_code,
          locale: locale || "en-US",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      }
      return new Intl.NumberFormat(locale || "th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val)
    },
    [currency_code, locale]
  )

  const format = formatValue || defaultFormatValue

  return (
    <div className={cn("relative w-full py-4 px-4", className)}>
      {/* Min and Max labels */}
      <div className="flex justify-between mb-2 sop-body-xs-regular text-sop-neutral-gray-400">
        <span>{format(minValue)}</span>
        <span>{format(maxValue)}</span>
      </div>

      <div
        ref={sliderRef}
        className="relative h-[6px] bg-sop-secondary-100 rounded-full cursor-pointer"
        onMouseDown={(e) => {
          if (!isDragging) {
            const newValue = getValueFromPosition(e.clientX)
            const minDist = Math.abs(newValue - minValue)
            const maxDist = Math.abs(newValue - maxValue)

            if (minDist < maxDist) {
              const clampedValue = Math.min(newValue, maxValue - step)
              setLocalValue({ min: clampedValue, max: maxValue })
              onRangeChange(clampedValue, maxValue)
            } else {
              const clampedValue = Math.max(newValue, minValue + step)
              setLocalValue({ min: minValue, max: clampedValue })
              onRangeChange(minValue, clampedValue)
            }
          }
        }}
      >
        {/* Active range track */}
        <div
          className="absolute h-[6px] bg-sop-secondary-500 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        {/* Min handle */}
        <div
          className={cn(
            "absolute w-4 h-4 bg-sop-secondary-500 rounded-full cursor-grab active:cursor-grabbing shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-10 transition-transform",
            isDragging === "min" && "scale-110"
          )}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={handleMouseDown("min")}
        >
          {isDragging === "min" && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-sop-neutral-gray-800 text-sop-base-white sop-body-xs-regular px-2 py-1 rounded pointer-events-none">
              {format(minValue)}
            </div>
          )}
        </div>

        {/* Max handle */}
        <div
          className={cn(
            "absolute w-4 h-4 bg-sop-secondary-500 rounded-full cursor-grab active:cursor-grabbing shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-10 transition-transform",
            isDragging === "max" && "scale-110"
          )}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={handleMouseDown("max")}
        >
          {isDragging === "max" && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-sop-neutral-gray-800 text-sop-base-white sop-body-xs-regular px-2 py-1 rounded pointer-events-none">
              {format(maxValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

