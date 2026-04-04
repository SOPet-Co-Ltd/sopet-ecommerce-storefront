"use client"

import { useState, useCallback } from "react"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
  CouponAuthErrorModal,
} from "@/components/molecules"
import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import { collectCoupon } from "@/lib/data/coupons"
import Image from "next/image"

const CouponSection = ({
  title,
  headerBgClass,
  headerText,
  coupons,
  onConditionsClick,
  onApply,
}: {
  title?: string
  headerBgClass: string
  headerText: string
  coupons: CouponData[]
  onConditionsClick: (coupon: CouponData) => void
  onApply: (coupon: CouponData) => void
}) => {
  const [visibleRows, setVisibleRows] = useState(2)
  const itemsPerRowDesktop = 4

  const visibleCoupons = coupons.slice(0, visibleRows * itemsPerRowDesktop)
  const hasMore = coupons.length > visibleCoupons.length

  const handleLoadMore = () => {
    setVisibleRows((prev) => prev + 1)
  }

  return (
    <section className="flex flex-col items-center w-full max-w-[1299px] mx-auto">
      {title && (
        <h2 className="sop-headline-md-medium text-sop-neutral-gray-300 mb-6 sm:mb-8 w-full">
          {title}
        </h2>
      )}
      <div
        className={`w-full ${headerBgClass} py-2 sm:py-3 flex justify-center mb-6 sm:mb-8`}
      >
        <h3 className="sop-headline-sm-medium text-white">{headerText}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center w-full">
        {visibleCoupons.map((coupon) => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            onConditionsClick={onConditionsClick}
            onApply={() => onApply(coupon)}
            isApplied={coupon.is_collected}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex w-full justify-center mt-6 sm:mt-10 mb-4">
          <button
            type="button"
            onClick={handleLoadMore}
            className="border border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-secondary-50 transition-colors 
                     rounded-[36px] py-2 px-8 font-medium text-sm sm:text-base shadow-sm"
          >
            ดูเพิ่มเติม
          </button>
        </div>
      )}
    </section>
  )
}

export type CouponsPageClientProps = {
  initialNewCustomer: CouponData[]
  initialShipping: CouponData[]
  initialSpecial: CouponData[]
}

export function CouponsPageClient({
  initialNewCustomer,
  initialShipping,
  initialSpecial,
}: CouponsPageClientProps) {
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)
  const [showCollected, setShowCollected] = useState(false)
  const [showAuthError, setShowAuthError] = useState(false)

  const [newCustomerCoupons, setNewCustomerCoupons] =
    useState(initialNewCustomer)
  const [shippingCoupons, setShippingCoupons] = useState(initialShipping)
  const [specialCoupons, setSpecialCoupons] = useState(initialSpecial)

  const handleApply = useCallback(async (coupon: CouponData) => {
    try {
      const res = await collectCoupon(coupon.id)
      if (res.success) {
        setShowCollected(true)

        const updateCoupons = (coupons: CouponData[]) =>
          coupons.map((c) =>
            c.id === coupon.id ? { ...c, is_collected: true } : c
          )

        if (coupon.category === "new_customer") {
          setNewCustomerCoupons(updateCoupons)
        } else if (coupon.category === "shipping") {
          setShippingCoupons(updateCoupons)
        } else {
          setSpecialCoupons(updateCoupons)
        }
      } else {
        if (res.message === "Unauthorized") {
          setShowAuthError(true)
        } else {
          alert(res.message || "ไม่สามารถเก็บคูปองได้")
        }
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเก็บคูปอง")
    }
  }, [])

  return (
    <div className="w-full bg-sop-primary-100 min-h-screen pb-20">
      <section className="relative w-full overflow-hidden h-[180px] sm:h-[250px] md:h-[300px] bg-white flex items-center justify-center">
        <Image
          src="/hero/coupons.png"
          alt="Banner"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>

      <div className="container mx-auto lg:px-0 -mt-sop-20px sm:mt-8 relative z-20 flex flex-col gap-8 sm:gap-12">
        {newCustomerCoupons.length > 0 && (
          <CouponSection
            title="คูปองส่วนลดพิเศษ"
            headerBgClass="bg-sop-primary-500"
            headerText="ลูกค้าใหม่"
            coupons={newCustomerCoupons}
            onConditionsClick={(coupon) => setSelectedCoupon(coupon)}
            onApply={handleApply}
          />
        )}

        {shippingCoupons.length > 0 && (
          <CouponSection
            headerBgClass="bg-sop-additionalblue-500"
            headerText="ส่วนลดค่าจัดส่ง"
            coupons={shippingCoupons}
            onConditionsClick={(coupon) => setSelectedCoupon(coupon)}
            onApply={handleApply}
          />
        )}

        {specialCoupons.length > 0 && (
          <CouponSection
            headerBgClass="bg-sop-secondary-500"
            headerText="ส่วนลดพิเศษอื่นๆ"
            coupons={specialCoupons}
            onConditionsClick={(coupon) => setSelectedCoupon(coupon)}
            onApply={handleApply}
          />
        )}
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
    </div>
  )
}
