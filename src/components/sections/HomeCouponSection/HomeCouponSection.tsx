"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
} from "@/components/molecules"
import { fetchCoupons, mapCouponToCardData } from "@/lib/data/coupons"

// Category-to-gradient mapping for home page display
const CATEGORY_GRADIENTS: Record<string, string> = {
  new_customer:
    "bg-[linear-gradient(90deg,var(--sop-ref-palette-primary-500,#9C6ADE)_30.29%,var(--sop-ref-palette-tertiary-500,#5587A0)_100%)]",
  shipping: "bg-sop-additionalblue-500",
  special: "bg-sop-secondary-500",
}

export const HomeCouponSection = () => {
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [showCollected, setShowCollected] = useState(false)
  const [coupons, setCoupons] = useState<any[]>([])

  const handleApply = useCallback(() => {
    setShowCollected(true)
  }, [])

  useEffect(() => {
    async function loadCoupons() {
      try {
        const allCoupons = await fetchCoupons()
        // Take first 4 coupons for the home page display
        const mapped = allCoupons.slice(0, 4).map((c) => ({
          ...mapCouponToCardData(c),
          bgGradient: CATEGORY_GRADIENTS[c.category] || "bg-sop-primary-500",
        }))
        setCoupons(mapped)
      } catch (error) {
        console.error("Failed to load home coupons:", error)
      }
    }
    loadCoupons()
  }, [])

  if (coupons.length === 0) return null

  return (
    <section className="w-full mb-12 hidden md:block">
      <div className="flex justify-between items-center px-4 md:px-0 mb-6">
        <h2 className="md:sop-headline-md-medium">โค้ดส่วนลด</h2>
        <Link
          href="/coupons"
          className="sop-link-md-regular text-sop-neutral-gray-300"
        >
          ดูส่วนลดทั้งหมด
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-0">
        {coupons.map((item, i) => (
          <CouponCard
            key={i}
            coupon={item}
            bgGradient={item.bgGradient}
            onConditionsClick={setSelectedCoupon}
            onApply={handleApply}
          />
        ))}
      </div>

      <CouponConditionsModal
        coupon={selectedCoupon}
        isOpen={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
      />

      <CouponCollectedModal
        isOpen={showCollected}
        onClose={() => setShowCollected(false)}
      />
    </section>
  )
}
