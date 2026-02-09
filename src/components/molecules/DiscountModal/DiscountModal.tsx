"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { Button, Input } from "@/components/atoms"
import { Text, clx } from "@medusajs/ui"
import { Ticket, X, ChevronRight } from "lucide-react"
import { applyPromotions, deletePromotionCode } from "@/lib/data/cart"
import { Cart } from "@/types/cart"
import { useState } from "react"
import Link from "next/link"

type DiscountModalProps = {
  isOpen: boolean
  close: () => void
  cart: Cart | null
}

const MOCK_COUPONS = [
  {
    code: "WELCOME25",
    title: "ส่วนลด 25%",
    description: "สำหรับผู้ใช้งานครั้งแรก",
    expiry: "25/12/2025",
    conditionsUrl: "#",
    imageColor: "bg-sop-primary-100",
  },
  {
    code: "FREESHIP",
    title: "ส่งฟรี",
    description: "เมื่อซื้อครบ 500 บาท",
    expiry: "31/12/2025",
    conditionsUrl: "#",
    imageColor: "bg-sop-primary-100",
  },
]

export const DiscountModal = ({ isOpen, close, cart }: DiscountModalProps) => {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply) return
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const success = await applyPromotions([codeToApply])
      if (success) {
        setMessage("โค้ดส่วนลดถูกใช้แล้ว")
        setCode("")
        // Don't close immediately to let user see success
      } else {
        setError("คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน")
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
        {/* Input Section */}
        <div className="flex gap-2 items-center">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="กรอกโค้ดส่วนลด"
            className="flex-1 bg-gray-50 border-none"
            title=""
          />
          <Button
            onClick={() => handleApply(code)}
            loading={isLoading}
            className="bg-sop-primary-500 text-white w-28 h-10 rounded-lg px-6"
            disabled={!code || isLoading}
          >
            ใช้โค้ด
          </Button>
        </div>

        {error && <Text className="text-red-500 text-sm">{error}</Text>}
        {message && <Text className="text-green-600 text-sm">{message}</Text>}

        <div className="w-full h-px bg-gray-100 my-2" />

        {/* Applied Coupons Section */}
        {appliedPromotions.length > 0 && (
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

        {/* Mock Coupon List */}
        <div className="flex flex-col gap-4">
          {MOCK_COUPONS.map((coupon, index) => (
            <CouponTicket
              key={index}
              coupon={coupon}
              onApply={() => handleApply(coupon.code)}
              isLoading={isLoading}
              isApplied={appliedPromotions.some((p) => p.code === coupon.code)}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}

const CouponTicket = ({
  coupon,
  onApply,
  isLoading,
  isApplied,
}: {
  coupon: (typeof MOCK_COUPONS)[0]
  onApply: () => void
  isLoading: boolean
  isApplied: boolean
}) => {
  return (
    <div
      className="flex w-full h-[120px] rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative group"
      onClick={!isApplied ? onApply : undefined}
    >
      {/* Left Part - Purple */}
      <div
        className={`w-[110px] ${coupon.imageColor} flex flex-col items-center justify-center text-center p-2 relative bg-sop-primary-300`}
      >
        <div className="text-sop-primary-500 font-bold text-xs leading-tight">
          Promotion
          <br />
          Image
        </div>
        {/* Circle Cutouts - Left Side */}
        <div className="absolute -left-sop-8px top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
      </div>

      {/* Right Part - White */}
      <div className="flex-1 bg-white p-4 flex flex-col justify-center relative border border-l-0 border-gray-100 rounded-r-xl">
        <div className="flex justify-between items-start">
          <div>
            <Text className="sop-body-md-medium text-gray-900">
              {coupon.title}
            </Text>
            <Text className="sop-body-xs-light text-gray-500 mt-1">
              {coupon.description}
            </Text>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-end">
          <div>
            <Link
              href={coupon.conditionsUrl}
              className="sop-body-xs-regular text-sop-primary-500 underline mb-1 block"
              onClick={(e) => e.stopPropagation()}
            >
              เงื่อนไขการใช้งาน
            </Link>
            <Text className="sop-body-xs-light text-gray-400">
              สิ้นสุด {coupon.expiry}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}
