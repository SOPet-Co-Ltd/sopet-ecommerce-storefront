"use client"

import { useState, useCallback, useEffect } from "react"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
} from "@/components/molecules"
import { fetchCoupons, mapCouponToCardData } from "@/lib/data/coupons"
import Image from "next/image"

// Define a reusable section component to handle the Load More logic
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
  coupons: any[]
  onConditionsClick: (coupon: any) => void
  onApply: () => void
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center w-full">
        {visibleCoupons.map((coupon, i) => (
          <CouponCard
            key={i}
            coupon={coupon}
            onConditionsClick={onConditionsClick}
            onApply={onApply}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex w-full justify-center mt-6 sm:mt-10 mb-4">
          <button
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

export default function CouponsPage() {
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [showCollected, setShowCollected] = useState(false)

  const [newCustomerCoupons, setNewCustomerCoupons] = useState<any[]>([])
  const [shippingCoupons, setShippingCoupons] = useState<any[]>([])
  const [specialCoupons, setSpecialCoupons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleApply = useCallback(() => {
    setShowCollected(true)
  }, [])

  useEffect(() => {
    async function loadCoupons() {
      setIsLoading(true)
      try {
        const [newCustomer, shipping, special] = await Promise.all([
          fetchCoupons("new_customer"),
          fetchCoupons("shipping"),
          fetchCoupons("special"),
        ])
        setNewCustomerCoupons(newCustomer.map(mapCouponToCardData))
        setShippingCoupons(shipping.map(mapCouponToCardData))
        setSpecialCoupons(special.map(mapCouponToCardData))
      } catch (error) {
        console.error("Failed to load coupons:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCoupons()
  }, [])

  return (
    <div className="w-full bg-sop-primary-100 min-h-screen pb-20">
      {/* Banner Section */}
      <section className="relative w-full overflow-hidden h-[180px] sm:h-[250px] md:h-[300px] bg-white flex items-center justify-center">
        {/* Decorative elements to mimic Figma bg */}
        <Image
          src="/hero/coupons.png"
          alt="Banner"
          fill
          className="object-cover object-center"
          priority
        />
      </section>

      {/* Coupon Categories */}
      <div className="container mx-auto px-2 lg:px-0 -mt-sop-20px sm:mt-8 relative z-20 flex flex-col gap-8 sm:gap-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sop-primary-500"></div>
          </div>
        ) : (
          <>
            {newCustomerCoupons.length > 0 && (
              <CouponSection
                title="คูปองส่วนลดพิเศษ"
                headerBgClass="bg-sop-primary-500"
                headerText="ลูกค้าใหม่"
                coupons={newCustomerCoupons}
                onConditionsClick={setSelectedCoupon}
                onApply={handleApply}
              />
            )}

            {shippingCoupons.length > 0 && (
              <CouponSection
                headerBgClass="bg-sop-additionalblue-500"
                headerText="ส่วนลดค่าจัดส่ง"
                coupons={shippingCoupons}
                onConditionsClick={setSelectedCoupon}
                onApply={handleApply}
              />
            )}

            {specialCoupons.length > 0 && (
              <CouponSection
                headerBgClass="bg-sop-secondary-500"
                headerText="ส่วนลดพิเศษอื่นๆ"
                coupons={specialCoupons}
                onConditionsClick={setSelectedCoupon}
                onApply={handleApply}
              />
            )}
          </>
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
    </div>
  )
}
