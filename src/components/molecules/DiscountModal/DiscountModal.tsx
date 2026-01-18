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
    <Modal heading="ส่วนลด SOPet" onClose={close}>
      <div className="flex flex-col gap-4 px-2 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
            <Input
              name="discount-code"
              placeholder="กรอกโค้ดส่วนลด"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-white"
              disabled={isLoading}
            />
            <Button
              variant="secondary"
              onClick={handleApply}
              className="whitespace-nowrap"
              loading={isLoading}
              disabled={!code || isLoading}
            >
              ใช้โค้ด
            </Button>
          </div>
          {error && <Text className="text-red-500 text-sm px-1">{error}</Text>}
          {message && (
            <Text className="text-green-600 text-sm px-1">{message}</Text>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <Text className="font-bold text-gray-700">โค้ดส่วนลดแนะนำ</Text>

          <div className="border rounded-lg p-3 flex justify-between items-center hover:border-purple-600 transition-colors cursor-pointer bg-white shadow-sm">
            <div className="flex flex-col">
              <Text className="font-bold text-purple-600">ลด ฿50</Text>
              <Text className="text-sm text-gray-500">เมื่อช้อปครบ ฿500</Text>
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                <Ticket className="w-3 h-3" />
                <span>ใช้ได้</span>
              </div>
            </div>
            <div className="h-4 w-4 rounded-full border border-gray-300"></div>
          </div>

          <div className="border rounded-lg p-3 flex justify-between items-center hover:border-purple-600 transition-colors cursor-pointer bg-white shadow-sm">
            <div className="flex flex-col">
              <Text className="font-bold text-purple-600">ส่งฟรี</Text>
              <Text className="text-sm text-gray-500">ไม่มีขั้นต่ำ</Text>
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                <Ticket className="w-3 h-3" />
                <span>ใช้ได้</span>
              </div>
            </div>
            <div className="h-4 w-4 rounded-full border border-gray-300"></div>
          </div>
        </div>

        <Button className="mt-4 w-full" onClick={close}>
          ตกลง
        </Button>
      </div>
    </Modal>
  )
}
