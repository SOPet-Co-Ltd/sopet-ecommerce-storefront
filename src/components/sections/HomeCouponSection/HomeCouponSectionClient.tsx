"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
  CouponAuthErrorModal,
} from "@/components/molecules"
import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { collectCoupon } from "@/lib/data/coupons"
import { HOME_COUPON_SCROLL_ROW_CLASS } from "./home-coupon-section-layout"

type HomeCouponSectionClientProps = {
  initialCoupons: CouponData[]
}

export function HomeCouponSectionClient({
  initialCoupons,
}: HomeCouponSectionClientProps) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)
  const [showCollected, setShowCollected] = useState(false)
  const [showAuthError, setShowAuthError] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const handleApply = useCallback(async (coupon: CouponData) => {
    setApplyingId(coupon.id)
    try {
      const res = await collectCoupon(coupon.id)
      if (res.success) {
        setShowCollected(true)
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_collected: true } : c
          )
        )
      } else if (res.message === "Unauthorized") {
        setShowAuthError(true)
      } else {
        alert(res.message || "ไม่สามารถเก็บคูปองได้")
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเก็บคูปอง")
    } finally {
      setApplyingId(null)
    }
  }, [])

  return (
    <section className="w-full">
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
      <div className={HOME_COUPON_SCROLL_ROW_CLASS}>
        {coupons.map((item, i) => (
          <div key={item.id ?? i} className="shrink-0 snap-start ">
            <CouponCard
              coupon={item}
              onConditionsClick={(coupon) => setSelectedCoupon(coupon)}
              onApply={() => handleApply(item)}
              isApplied={item.is_collected}
              isLoading={applyingId === item.id}
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
