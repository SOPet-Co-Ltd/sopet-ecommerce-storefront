"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { Button, Input } from "@/components/atoms"
import { Text } from "@medusajs/ui"
import { Ticket } from "lucide-react"
import { applyPromotions } from "@/lib/data/cart"
import { Cart } from "@/types/cart"
import { useState } from "react"

type DiscountModalProps = {
  isOpen: boolean
  close: () => void
  cart: Cart | null
}

export const DiscountModal = ({ isOpen, close, cart }: DiscountModalProps) => {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleApply = async () => {
    if (!code) return
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const success = await applyPromotions([code])
      if (success) {
        setMessage("โค้ดส่วนลดถูกใช้แล้ว")
        setTimeout(() => {
          close()
          setCode("")
          setMessage(null)
        }, 1500)
      } else {
        setError("ไม่สามารถใช้โค้ดนี้ได้")
      }
    } catch (e: unknown) {
      setError((e as Error).message || "เกิดข้อผิดพลาด")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal heading="คูปองส่วนลดของ SOPet" onClose={close}>
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
            onClick={handleApply}
            loading={isLoading}
            className="bg-sop-primary-500 text-white w-28 h-10 rounded-lg px-6"
            disabled={!code}
          >
            ใช้โค้ด
          </Button>
        </div>

        {error && <Text className="text-red-500 text-sm">{error}</Text>}
        {message && <Text className="text-green-600 text-sm">{message}</Text>}

        {/* Coupon List */}
        <div className="space-y-3 mt-2">
          {[1, 2, 3].map((_, idx) => (
            <div
              key={idx}
              className="flex h-[120px] rounded-xl overflow-hidden  relative group cursor-pointer hover:border-sop-primary-200 transition-all"
            >
              {/* Left Side - Image/Promo */}
              <div className="w-[120px] bg-sop-primary-300 flex flex-col items-center justify-center text-sop-primary-300 relative">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-10" />
                <span className="font-bold text-lg">Promotion</span>
                <span className="font-bold text-lg">Image</span>
              </div>

              {/* Right Side - Details */}
              <div className="flex-1 p-4 flex flex-col justify-center bg-white relative border border-gray-300 border-l-0 rounded-r-xl">
                <h4 className="heading-md text-gray-900">ส่วนลด 25%</h4>
                <p className="text-sm text-gray-500 mt-1">
                  สำหรับผู้ใช้งานครั้งแรก
                </p>
                <p className="text-xs text-sop-primary-500 underline mt-1 cursor-pointer">
                  เงื่อนไขการใช้งาน
                </p>
                <p className="text-xs text-gray-400 mt-auto">
                  สิ้นสุด 25/12/2025
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
