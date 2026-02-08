"use client"

import { DiscountModal } from "@/components/molecules/DiscountModal"
import { useState } from "react"
import { Cart } from "@/types/cart"
import { DiscountIcon } from "@/icons"

export const CheckoutDiscountSection = ({ cart }: { cart: Cart | null }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className="bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-transparent hover:border-purple-100 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 text-gray-700">
          <DiscountIcon className="w-6 h-6" />
          <span className="font-medium">ส่วนลด SOPet</span>
        </div>
        <div className="text-gray-400">{">"}</div>
      </div>

      <DiscountModal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        cart={cart}
      />
    </>
  )
}
