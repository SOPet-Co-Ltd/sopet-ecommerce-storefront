"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { Text } from "@medusajs/ui"
import { Ticket, X } from "lucide-react"
import { applyPromotions, deletePromotionCode } from "@/lib/data/cart"
import { Cart } from "@/types/cart"
import { useState, useEffect } from "react"
import { CouponCard } from "../CouponCard/CouponCard"
import { CouponConditionsModal } from "../CouponConditionsModal/CouponConditionsModal"
import { fetchMyCoupons } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"

type DiscountModalProps = {
  isOpen: boolean
  close: () => void
  cart: Cart | null
  vendorName?: string
  showAppliedPromotions?: boolean
}

export const DiscountModal = ({
  isOpen,
  close,
  cart,
  vendorName,
  showAppliedPromotions = true,
}: DiscountModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [myCoupons, setMyCoupons] = useState<any[]>([])
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function loadWalletCoupons() {
      setIsFetchingCoupons(true)
      try {
        const data = await fetchMyCoupons()
        let mapped = data.map(mapCouponToCardData)
        if (vendorName) {
          mapped = mapped.filter((c) => {
            if (!c.vendorName) return false
            return (
              c.vendorName.toLowerCase().includes(vendorName.toLowerCase()) ||
              vendorName.toLowerCase().includes(c.vendorName.toLowerCase())
            )
          })
        }
        setMyCoupons(mapped)
      } catch (e) {
        console.error("Failed to fetch wallet coupons:", e)
      } finally {
        setIsFetchingCoupons(false)
      }
    }
    loadWalletCoupons()
  }, [isOpen, vendorName])

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply) return
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await applyPromotions([codeToApply])

      // applyPromotions returns false only when it explicitly fails
      // It may return undefined on success if cart.promotions isn't populated in the response
      if (result === false) {
        setError("คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน")
      } else {
        setMessage("โค้ดส่วนลดถูกใช้แล้ว")
      }
    } catch (e: any) {
      // Handle backend error gracefully
      const errorMessage = e?.message || ""
      if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("not found")
      ) {
        setError("คูปองไม่ถูกต้อง หรือหมดอายุแล้ว")
      } else {
        setError("เกิดข้อผิดพลาดในการใช้คูปอง")
      }
      console.error("Discount Error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (codeToRemove: string) => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      await deletePromotionCode(codeToRemove)
      setMessage("ลบโค้ดส่วนลดแล้ว")
    } catch (e: unknown) {
      setError("เกิดข้อผิดพลาดในการลบคูปอง")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const appliedPromotions = cart?.promotions || []

  return (
    <Modal header={<span>คูปองส่วนลดของ SOPet</span>} onClose={close}>
      <div className="px-4 pb-4 flex flex-col gap-4">
        {error && <Text className="text-red-500 text-sm">{error}</Text>}
        {message && <Text className="text-green-600 text-sm">{message}</Text>}

        {/* Applied Coupons Section */}
        {showAppliedPromotions && appliedPromotions.length > 0 && (
          <div className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-gray-900">
              คูปองที่ใช้อยู่
            </Text>
            {appliedPromotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-full border border-green-100">
                    <Ticket className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <Text className="text-sm font-bold text-green-700">
                      {promo.code}
                    </Text>
                    <Text className="text-xs text-green-600">ใช้งานแล้ว</Text>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(promo.code!)}
                  disabled={isLoading}
                  className="p-1 hover:bg-green-100 rounded-full transition-colors text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="w-full h-px bg-gray-100 my-2" />
          </div>
        )}

        {/* Collected Coupon List */}
        <div className="flex flex-col gap-4">
          <Text className="text-sm font-medium text-gray-900">
            โค้ดส่วนลดของฉัน
          </Text>
          {isFetchingCoupons ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sop-primary-500"></div>
            </div>
          ) : myCoupons.length > 0 ? (
            myCoupons.map((coupon, index) => (
              <CouponCard
                key={index}
                coupon={coupon}
                onApply={() => handleApply(coupon.code)}
                onConditionsClick={(c) => setSelectedCoupon(c)}
                isApplied={appliedPromotions.some(
                  (p) => p.code === coupon.code
                )}
                mode="use"
              />
            ))
          ) : (
            <Text className="text-sm text-gray-500 text-center py-4">
              คุณยังไม่มีคูปองส่วนลดในขณะนี้
            </Text>
          )}
        </div>
      </div>

      <CouponConditionsModal
        coupon={selectedCoupon}
        isOpen={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
      />
    </Modal>
  )
}
