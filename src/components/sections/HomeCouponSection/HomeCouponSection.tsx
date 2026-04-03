"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
  CouponAuthErrorModal,
} from "@/components/molecules"
import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { fetchCoupons, collectCoupon } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"

export const HomeCouponSection = () => {
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)
  const [showCollected, setShowCollected] = useState(false)
  const [showAuthError, setShowAuthError] = useState(false)
  const [coupons, setCoupons] = useState<CouponData[]>([])

  const handleApply = useCallback(async (coupon: CouponData) => {
    try {
      const res = await collectCoupon(coupon.id)
      if (res.success) {
        setShowCollected(true)
        // Mark as collected in local state
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_collected: true } : c
          )
        )
      } else {
        if (res.message === "Unauthorized") {
          setShowAuthError(true)
        } else {
          alert(res.message || "ไม่สามารถเก็บคูปองได้")
        }
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการเก็บคูปอง")
    }
  }, [])

  useEffect(() => {
    async function loadCoupons() {
      try {
        const homeCoupons = await fetchCoupons(undefined, 20, 0)
        setCoupons(homeCoupons.map((coupon) => mapCouponToCardData(coupon)))
      } catch (error) {
        console.error("Failed to load home coupons:", error)
      }
    }
    loadCoupons()
  }, [])

  if (coupons.length === 0) return null

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center px-4 md:px-0 mb-6">
        <h2 className="sop-body-lg-medium md:sop-headline-md-medium">
          โค้ดส่วนลด
        </h2>
        <Link
          href="/coupons"
          className="sop-link-xs-regular md:sop-link-md-regular text-sop-neutral-gray-300"
        >
          ดูส่วนลดทั้งหมด
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 pr-4 lg:px-0 snap-x snap-mandatory scroll-smooth overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {coupons.map((item, i) => (
          <div
            key={item.id ?? i}
            className="w-[280px] shrink-0 snap-start sm:w-[320px]"
          >
            <CouponCard
              coupon={item}
              onConditionsClick={(coupon) => setSelectedCoupon(coupon)}
              onApply={() => handleApply(item)}
              isApplied={item.is_collected}
            />
          </div>
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

      <CouponAuthErrorModal
        isOpen={showAuthError}
        onClose={() => setShowAuthError(false)}
      />
    </section>
  )
}
