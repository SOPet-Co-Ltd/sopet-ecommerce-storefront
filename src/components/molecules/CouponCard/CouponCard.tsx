"use client"

import { Text } from "@medusajs/ui"
import Link from "next/link"
import { Button } from "@/components/atoms"
import { useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type CouponCategory = "new_customer" | "shipping" | "special"

export type CouponData = {
  id: string
  code: string
  title: string
  description: string
  expiry: string
  conditionsUrl: string
  conditions?: string | null
  category?: CouponCategory | string
  vendorName?: string
  minPurchase?: string | null
  imageColor?: string
  leftTextTop?: string
  leftTextBottom?: string
  is_collected?: boolean
  is_used?: boolean
  isEligible?: boolean
  ineligibilityReason?: string
  eligibilityFingerprint?: string
}

export type CouponCardProps = {
  coupon: CouponData
  onApply?: () => void | Promise<boolean | void>
  onConditionsClick?: (coupon: CouponData) => void
  isLoading?: boolean
  isApplied?: boolean
  isDisabled?: boolean
  disabledReason?: string
  mode?: "collect" | "use"
}

/**
 * Left stub: 140×160px, r=12 rounded top-left & bottom-left, semicircular notch on the
 * left edge centered at y=80 (same geometry as SVG like M8 8 … half-circle on the left).
 */
const COUPON_STUB_CLIP_PATH =
  "path('M140 0H0V72C4.41828 72 8 75.5817 8 80C8 84.4183 4.41828 88 0 88V160H140V0Z')"

const NEW_CUSTOMER_GRADIENT =
  "linear-gradient(90deg, var(--sop-ref-palette-primary-500, #9C6ADE) 30.29%, var(--sop-ref-palette-tertiary-500, #5587A0) 100%)"

function leftStubClassAndStyle(coupon: CouponData): {
  className: string
  style: CSSProperties
} {
  const cat = coupon.category
  const base =
    "w-[140px] h-sop-160px shrink-0 flex flex-col items-center justify-center text-center p-2 relative"

  if (cat === "shipping") {
    return {
      className: cn(base, "bg-sop-additionalblue-500"),
      style: { clipPath: COUPON_STUB_CLIP_PATH },
    }
  }

  if (cat === "special") {
    return {
      className: cn(base, "bg-sop-secondary-500"),
      style: { clipPath: COUPON_STUB_CLIP_PATH },
    }
  }

  // new_customer (default) or unknown: optional API imageColor, else gradient
  return {
    className: cn(base, coupon.imageColor || ""),
    style: {
      clipPath: COUPON_STUB_CLIP_PATH,
      ...(!coupon.imageColor ? { background: NEW_CUSTOMER_GRADIENT } : {}),
    },
  }
}

export const CouponCard = ({
  coupon,
  onApply,
  onConditionsClick,
  isLoading,
  isApplied: externalIsApplied,
  isDisabled = false,
  disabledReason,
  mode = "collect",
}: CouponCardProps) => {
  const [localApplied, setLocalApplied] = useState(false)
  const isApplied =
    externalIsApplied !== undefined
      ? externalIsApplied
      : coupon.is_collected || localApplied
  const isUsed = coupon.is_used || false
  const isActionBlocked = isDisabled || isApplied || isUsed
  const shouldShowDisabledOverlay = isDisabled && !isApplied && !isUsed
  const leftStub = leftStubClassAndStyle(coupon)

  const handleApply = async () => {
    if (!onApply || isActionBlocked || isLoading) {
      return
    }

    try {
      const result = await onApply()
      if (result !== false) {
        setLocalApplied(true)
      }
    } catch {
      // Parent handles surface-level error state.
    }
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-[305px] h-sop-160px rounded-xl overflow-hidden transition-shadow relative group",
        isDisabled
          ? "opacity-50 grayscale pointer-events-none select-none"
          : onApply && !isActionBlocked && !isLoading
            ? "cursor-pointer hover:shadow-md"
            : isApplied
              ? "ring-1 ring-green-200 bg-green-50/40"
              : "opacity-80"
      )}
      onClick={
        onApply && !isActionBlocked && !isLoading ? handleApply : undefined
      }
    >
      {/* Left Part — category: new_customer = gradient (or imageColor), shipping = blue, special = secondary */}
      <div className={leftStub.className} style={leftStub.style}>
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
          {disabledReason && (
            <Text className="sop-body-xs-light text-amber-600">
              {disabledReason}
            </Text>
          )}
          <div className="mt-1 flex w-full justify-end">
            <Button
              className={cn(
                isDisabled || isUsed
                  ? "cursor-not-allowed bg-sop-neutral-grayalpha-200 text-sop-neutral-gray-300 hover:bg-sop-neutral-grayalpha-200"
                  : isApplied
                    ? "cursor-default border border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
                    : "bg-sop-additionalgreen-500 text-sop-neutral-grayfixed-600 hover:bg-sop-additionalgreen-600"
              )}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (!isActionBlocked) {
                  void handleApply()
                }
              }}
              disabled={isLoading || isActionBlocked}
            >
              <span className="text-sop-3XS sm:sop-body-xs-medium">
                {isUsed
                  ? "โค้ดถูกใช้แล้ว"
                  : isDisabled
                    ? "ใช้ไม่ได้"
                    : mode === "use"
                      ? isApplied
                        ? "ใช้งานอยู่"
                        : "ใช้โค้ด"
                      : isApplied
                        ? "เก็บแล้ว"
                        : "เก็บโค้ดส่วนลด"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {shouldShowDisabledOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/72 backdrop-blur-[1px] px-5 text-center">
          <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-black/5">
            <Text className="sop-body-sm-medium text-sop-neutral-gray-500">
              ใช้ไม่ได้
            </Text>
            {disabledReason && (
              <Text className="mt-1 sop-body-xs-regular text-sop-neutral-gray-400">
                {disabledReason}
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
