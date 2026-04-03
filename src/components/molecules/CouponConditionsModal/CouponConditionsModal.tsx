"use client"

import { Modal, CouponCard } from "@/components/molecules"
import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"

type CouponConditionsModalProps = {
  coupon: CouponData | null
  isOpen: boolean
  onClose: () => void
}

export const CouponConditionsModal = ({
  coupon,
  isOpen,
  onClose,
}: CouponConditionsModalProps) => {
  if (!isOpen || !coupon) return null

  // Ensure the internal CouponCard in the modal shouldn't be interactable or have a conditions clickable
  const displayCoupon = { ...coupon, isDisplayOnly: true }

  return (
    <Modal onClose={onClose} width={400} className="w-full sm:w-[500px]">
      <div className="flex flex-col w-full h-full max-h-[80vh]">
        {/* Top Section - Purple Background with Coupon */}
        <div className="bg-sop-primary-100 p-4 sm:p-6 flex justify-center w-full rounded-t-[20px]">
          <div className="w-full max-w-[340px] pointer-events-none pb-4">
            {/* Note: CouponCard currently takes 'coupon' prop, passing down the displayCoupon */}
            <CouponCard coupon={displayCoupon} />
          </div>
        </div>

        {/* Middle Section - Title */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="sop-headline-md-medium text-sop-neutral-gray-200">
            เงื่อนไขการใช้คูปองส่วนลด
          </h2>
        </div>

        {/* Bottom Section - Scrollable Terms */}
        <div className="px-6 pb-6 overflow-y-auto">
          <p className="sop-body-sm-regular text-sop-neutral-gray-400 whitespace-pre-wrap">
            {coupon.conditions || "ไม่มีข้อมูลเงื่อนไขสำหรับคูปองนี้"}
          </p>
        </div>
      </div>
    </Modal>
  )
}
