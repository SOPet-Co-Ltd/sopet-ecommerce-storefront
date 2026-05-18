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
        <div className="flex items-center gap-2">
          <DiscountIcon className="w-sop-20px h-sop-20px md:w-sop-28px md:h-sop-28px text-sop-additionalblue-400" />
          <span className="sop-body-sm-regular md:sop-body-lg-regular text-sop-additionalblue-400">
            ส่วนลด Sopet
          </span>
        </div>
        <div className="sop-body-sm-regular md:sop-body-lg-regular text-sop-neutral-gray-300">
          {">"}
        </div>
      </div>

      <DiscountModal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        cart={cart}
      />
    </>
  )
}
