"use client"

import { useCallback } from "react"
import {
  CouponCard,
  CouponConditionsModal,
  CouponCollectedModal,
  CouponAuthErrorModal,
} from "@/components/molecules"
import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import type {
  CouponsPageBundleData,
  CouponsPageCategoryKey,
} from "@/lib/data/coupons-page"
import { useCollectCouponMutation, useCouponsPageQuery } from "@/hooks/useCouponsQuery"
import { toast } from "@/lib/helpers/toast"
import { useCouponsPageUiStore } from "@/lib/zustand/coupons-page-ui-store"
import Image from "next/image"

const CouponSection = ({
  category,
  title,
  headerBgClass,
  headerText,
  coupons,
  visibleRows,
  onConditionsClick,
  onApply,
  onLoadMore,
  applyingCouponId,
}: {
  category: CouponsPageCategoryKey
  title?: string
  headerBgClass: string
  headerText: string
  coupons: CouponData[]
  visibleRows: number
  onConditionsClick: (coupon: CouponData) => void
  onApply: (coupon: CouponData) => void
  onLoadMore: (category: CouponsPageCategoryKey) => void
  applyingCouponId: string | null
}) => {
  const itemsPerRowDesktop = 4

  const visibleCoupons = coupons.slice(0, visibleRows * itemsPerRowDesktop)
  const hasMore = coupons.length > visibleCoupons.length

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
            isLoading={applyingCouponId === coupon.id}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex w-full justify-center mt-6 sm:mt-10 mb-4">
          <button
            type="button"
            onClick={() => onLoadMore(category)}
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

export type CouponsPageClientProps = { initialData: CouponsPageBundleData }

export function CouponsPageClient({
  initialData,
}: CouponsPageClientProps) {
  const selectedCoupon = useCouponsPageUiStore((state) => state.selectedCoupon)
  const showCollected = useCouponsPageUiStore((state) => state.showCollected)
  const showAuthError = useCouponsPageUiStore((state) => state.showAuthError)
  const applyingCouponId = useCouponsPageUiStore(
    (state) => state.applyingCouponId
  )
  const visibleRowsByCategory = useCouponsPageUiStore(
    (state) => state.visibleRowsByCategory
  )
  const openCouponConditions = useCouponsPageUiStore(
    (state) => state.openCouponConditions
  )
  const closeCouponConditions = useCouponsPageUiStore(
    (state) => state.closeCouponConditions
  )
  const openCollectedModal = useCouponsPageUiStore(
    (state) => state.openCollectedModal
  )
  const closeCollectedModal = useCouponsPageUiStore(
    (state) => state.closeCollectedModal
  )
  const openAuthErrorModal = useCouponsPageUiStore(
    (state) => state.openAuthErrorModal
  )
  const closeAuthErrorModal = useCouponsPageUiStore(
    (state) => state.closeAuthErrorModal
  )
  const setApplyingCouponId = useCouponsPageUiStore(
    (state) => state.setApplyingCouponId
  )
  const incrementVisibleRows = useCouponsPageUiStore(
    (state) => state.incrementVisibleRows
  )

  const couponsQuery = useCouponsPageQuery(initialData)
  const collectCouponMutation = useCollectCouponMutation()
  const bundle = couponsQuery.data ?? initialData

  const handleApply = useCallback(
    async (coupon: CouponData) => {
      setApplyingCouponId(coupon.id)

      try {
        await collectCouponMutation.mutateAsync(coupon.id)
        openCollectedModal()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ไม่สามารถเก็บคูปองได้"

        if (message === "Unauthorized") {
          openAuthErrorModal()
        } else {
          toast.error({
            title: "ไม่สามารถเก็บคูปองได้",
            description: message || "เกิดข้อผิดพลาดในการเก็บคูปอง",
          })
        }
      } finally {
        setApplyingCouponId(null)
      }
    },
    [
      collectCouponMutation,
      openAuthErrorModal,
      openCollectedModal,
      setApplyingCouponId,
    ]
  )

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
        {bundle.newCustomer.length > 0 && (
          <CouponSection
            category="new_customer"
            title="คูปองส่วนลดพิเศษ"
            headerBgClass="bg-sop-primary-500"
            headerText="ลูกค้าใหม่"
            coupons={bundle.newCustomer}
            visibleRows={visibleRowsByCategory.new_customer}
            onConditionsClick={openCouponConditions}
            onApply={handleApply}
            onLoadMore={incrementVisibleRows}
            applyingCouponId={applyingCouponId}
          />
        )}

        {bundle.shipping.length > 0 && (
          <CouponSection
            category="shipping"
            headerBgClass="bg-sop-additionalblue-500"
            headerText="ส่วนลดค่าจัดส่ง"
            coupons={bundle.shipping}
            visibleRows={visibleRowsByCategory.shipping}
            onConditionsClick={openCouponConditions}
            onApply={handleApply}
            onLoadMore={incrementVisibleRows}
            applyingCouponId={applyingCouponId}
          />
        )}

        {bundle.special.length > 0 && (
          <CouponSection
            category="special"
            headerBgClass="bg-sop-secondary-500"
            headerText="ส่วนลดพิเศษอื่นๆ"
            coupons={bundle.special}
            visibleRows={visibleRowsByCategory.special}
            onConditionsClick={openCouponConditions}
            onApply={handleApply}
            onLoadMore={incrementVisibleRows}
            applyingCouponId={applyingCouponId}
          />
        )}
      </div>

      <CouponConditionsModal
        coupon={selectedCoupon}
        isOpen={!!selectedCoupon}
        onClose={closeCouponConditions}
      />

      <CouponCollectedModal
        isOpen={showCollected}
        onClose={closeCollectedModal}
      />

      <CouponAuthErrorModal
        isOpen={showAuthError}
        onClose={closeAuthErrorModal}
      />
    </div>
  )
}
