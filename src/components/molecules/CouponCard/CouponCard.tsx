"use client"

import { Text } from "@medusajs/ui"
import Link from "next/link"
import { Button } from "@/components/atoms"
import { useState } from "react"

export type CouponData = {
  id: string
  code: string
  title: string
  description: string
  expiry: string
  conditionsUrl: string
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
      className={`flex w-full max-w-[320px] min-h-[156px] h-full rounded-xl overflow-hidden hover:shadow-md transition-shadow relative group ${
        onApply && !isApplied ? "cursor-pointer" : ""
      }`}
      onClick={
        onApply && !isApplied
          ? () => {
              setLocalApplied(true)
              if (onApply) onApply()
            }
          : undefined
      }
    >
      {/* Left Part - Promotional Background */}
      <div
        className={`w-[110px] sm:w-[130px] shrink-0 ${
          coupon.imageColor || ""
        } flex flex-col items-center justify-center text-center p-2 relative`}
        style={
          !coupon.imageColor
            ? {
                background:
                  "linear-gradient(90deg, var(--sop-ref-palette-primary-500, #9C6ADE) 30.29%, var(--sop-ref-palette-tertiary-500, #5587A0) 100%)",
              }
            : undefined
        }
      >
        <div className="text-white sop-body-lg-medium text-center drop-shadow-sm mb-1 leading-tight px-1 wrap-break-word">
          {coupon.leftTextTop || "Promotion"}
        </div>
        <div className="text-white sop-body-xs-regular text-center drop-shadow-sm px-1 leading-tight wrap-break-word">
          {coupon.leftTextBottom || "Image"}
        </div>
        {/* Circle Cutouts - Left Side */}
        <div className="absolute -left-sop-8px top-1/2 -translate-y-1/2 w-6 h-6 bg-sop-primary-100 rounded-full z-10" />
      </div>

      {/* Right Part - White Details */}
      <div className="flex-1 bg-white p-3 sm:p-4 flex flex-col justify-start relative border border-l-0 border-gray-100 rounded-r-xl overflow-hidden">
        <div className="flex flex-col mb-1.5">
          {coupon.vendorName && (
            <div className="flex items-center gap-1 mb-1">
              <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-sop-3XS font-medium leading-none">
                ร้านค้า
              </span>
              <Text className="sop-body-xs-regular text-gray-600 leading-none truncate">
                {coupon.vendorName}
              </Text>
            </div>
          )}
          <Text className="sop-body-md-medium text-gray-900 leading-tight mb-1 wrap-break-word">
            {coupon.title}
          </Text>
          <Text className="sop-body-xs-light text-gray-500 leading-snug wrap-break-word line-clamp-2">
            {coupon.description}
          </Text>
        </div>

        <div className="mt-auto flex flex-col justify-start items-start w-full gap-0.5">
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

          <div className="flex justify-end w-full mt-1.5">
            <Button
              className={`rounded-full px-3 sm:px-4 h-auto min-h-sop-24px sm:min-h-sop-32px py-1 sm:py-1.5 border-none shadow-sm whitespace-nowrap transition-colors ${
                isApplied || isUsed
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                  : "bg-[#82C3A2] hover:bg-[#6fb390] text-white"
              }`}
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
