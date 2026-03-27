"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
  CouponAuthErrorModal,
} from "@/components/molecules"
import { fetchCoupons, collectCoupon } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"

export const HomeCouponSection = () => {
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [showCollected, setShowCollected] = useState(false)
  const [showAuthError, setShowAuthError] = useState(false)
  const [coupons, setCoupons] = useState<any[]>([])

  const handleApply = useCallback(async (coupon: any) => {
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
        const allCoupons = await fetchCoupons()
        // Take first 4 coupons for the home page display
        const mapped = allCoupons.slice(0, 4).map((c) => mapCouponToCardData(c))
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
            onConditionsClick={setSelectedCoupon}
            onApply={() => handleApply(item)}
            isApplied={item.is_collected}
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

      <CouponAuthErrorModal
        isOpen={showAuthError}
        onClose={() => setShowAuthError(false)}
      />
    </section>
  )
}
