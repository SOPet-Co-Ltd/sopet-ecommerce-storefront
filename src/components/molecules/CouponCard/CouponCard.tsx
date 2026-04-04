"use client"

import { Text } from "@medusajs/ui"
import Link from "next/link"
import { Button } from "@/components/atoms"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type CouponData = {
  id: string
  code: string
  title: string
  description: string
  expiry: string
  conditionsUrl: string
  conditions?: string | null
  category?: string
  vendorName?: string
  imageColor?: string
  leftTextTop?: string
  leftTextBottom?: string
  is_collected?: boolean
  is_used?: boolean
}

export type CouponCardProps = {
  coupon: CouponData
  onApply?: () => void
  onConditionsClick?: (coupon: CouponData) => void
  isLoading?: boolean
  isApplied?: boolean
  mode?: "collect" | "use"
}

/**
 * Left stub: 140×160px, r=12 rounded top-left & bottom-left, semicircular notch on the
 * left edge centered at y=80 (same geometry as SVG like M8 8 … half-circle on the left).
 */
const COUPON_STUB_CLIP_PATH =
  "path('M140 0H0V72C4.41828 72 8 75.5817 8 80C8 84.4183 4.41828 88 0 88V160H140V0Z')"

export const CouponCard = ({
  coupon,
  onApply,
  onConditionsClick,
  isLoading,
  isApplied: externalIsApplied,
  mode = "collect",
}: CouponCardProps) => {
  const [localApplied, setLocalApplied] = useState(false)
  const isApplied =
    externalIsApplied !== undefined
      ? externalIsApplied
      : coupon.is_collected || localApplied
  const isUsed = coupon.is_used || false

  return (
    <div
      className={`flex w-[305px] h-sop-160px rounded-xl overflow-hidden hover:shadow-md transition-shadow relative group ${
        onApply && !isApplied && !isLoading ? "cursor-pointer" : ""
      }`}
      onClick={
        onApply && !isApplied && !isLoading
          ? () => {
              setLocalApplied(true)
              if (onApply) onApply()
            }
          : undefined
      }
    >
      {/* Left Part - Promotional Background */}
      <div
        className={`w-[140px] h-sop-160px shrink-0 ${
          coupon.imageColor || ""
        } flex flex-col items-center justify-center text-center p-2 relative`}
        style={{
          clipPath: COUPON_STUB_CLIP_PATH,
          ...(!coupon.imageColor
            ? {
                background:
                  "linear-gradient(90deg, var(--sop-ref-palette-primary-500, #9C6ADE) 30.29%, var(--sop-ref-palette-tertiary-500, #5587A0) 100%)",
              }
            : {}),
        }}
      >
        <div className="text-white sop-body-lg-medium text-center drop-shadow-sm mb-1 leading-tight px-1 wrap-break-word">
          {coupon.leftTextTop || "Promotion"}
        </div>
        <div className="text-white sop-body-xs-regular text-center drop-shadow-sm px-1 leading-tight wrap-break-word">
          {coupon.leftTextBottom || "Image"}
        </div>
      </div>

      {/* Right Part - White Details */}
      <div className="flex h-sop-160px w-[165px] shrink-0 min-h-0 flex-col bg-white px-4 py-3 relative overflow-hidden border border-l-0 border-gray-100 rounded-r-xl">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
          {coupon.vendorName && (
            <div className="flex min-w-0 items-center gap-1 shrink-0">
              <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-sop-3XS font-medium leading-none whitespace-nowrap text-orange-600">
                ร้านค้า
              </span>
              <Text className="min-w-0 sop-body-xs-regular leading-none text-gray-600 truncate">
                {coupon.vendorName}
              </Text>
            </div>
          )}
          <Text className="shrink-0 sop-body-md-medium leading-tight text-gray-900 wrap-break-word line-clamp-1">
            {coupon.title}
          </Text>
          <Text className="min-h-0 flex-1 sop-body-xs-light leading-snug text-gray-500 wrap-break-word line-clamp-2">
            {coupon.description}
          </Text>
        </div>

        <div className="mt-1 flex w-full shrink-0 flex-col gap-0.5 pt-0.5">
          <Link
            href={coupon.conditionsUrl || "#"}
            className="sop-body-xs-regular text-sop-primary-500 underline"
            onClick={(e) => {
              e.stopPropagation()
              if (onConditionsClick) {
                e.preventDefault()
                onConditionsClick(coupon)
              }
            }}
          >
            เงื่อนไขการใช้งาน
          </Link>
          <Text className="sop-body-xs-light text-gray-400">
            สิ้นสุด {coupon.expiry}
          </Text>
          <div className="mt-1 flex w-full justify-end">
            <Button
              className={cn(
                isApplied || isUsed
                  ? "cursor-not-allowed bg-sop-neutral-grayalpha-200 text-sop-neutral-gray-300 hover:bg-sop-neutral-grayalpha-200"
                  : "bg-sop-additionalgreen-500 text-sop-neutral-grayfixed-600 hover:bg-sop-additionalgreen-600"
              )}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (!isApplied && !isUsed) {
                  setLocalApplied(true)
                  if (onApply) onApply()
                }
              }}
              disabled={isLoading || isApplied || isUsed}
            >
              <span className="text-sop-3XS sm:sop-body-xs-medium">
                {isUsed
                  ? "โค้ดถูกใช้แล้ว"
                  : mode === "use"
                    ? isApplied
                      ? "ใช้งานแล้ว"
                      : "ใช้โค้ด"
                    : isApplied
                      ? "เก็บแล้ว"
                      : "เก็บโค้ดส่วนลด"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
