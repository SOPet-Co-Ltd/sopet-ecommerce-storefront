"use client"

import { DiscountModal } from "@/components/molecules/DiscountModal"
import { Button } from "@/components/atoms"
import { useState } from "react"
import { Ticket } from "lucide-react"
import { Cart } from "@/types/cart"

export const CheckoutDiscountSection = ({ cart }: { cart: Cart | null }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className="bg-white p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-transparent hover:border-purple-100 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 text-gray-700">
          <Ticket className="w-5 h-5 text-purple-600" />
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
