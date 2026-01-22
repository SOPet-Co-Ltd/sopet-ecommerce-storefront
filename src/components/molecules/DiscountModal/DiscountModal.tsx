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

        {/* Coupon List - Hidden for now as we don't have a public endpoint for coupons */}
        {/* <div className="space-y-3 mt-2"> ... </div> */}
      </div>
    </Modal>
  )
}
