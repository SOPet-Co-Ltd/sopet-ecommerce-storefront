"use client"

import PaymentButton from "./PaymentButton"
import CheckoutItemPreview from "@/components/molecules/CheckoutItemPreview/CheckoutItemPreview"
import { Cart } from "@/types/cart"
import { Heading } from "@medusajs/ui"
import { ClipboardList } from "lucide-react"

const Review = ({ cart }: { cart: Cart }) => {
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div>
      <div className="bg-sop-base-white pt-2 px-4 ">
        <div className="flex flex-row items-center gap-2 border-b border-sop-neutral-gray-light py-2 ">
          <ClipboardList className="text-purple-600 w-6 h-6" />
          <Heading level="h2" className="text-xl text-purple-600 font-normal">
            คำสั่งซื้อสินค้า
          </Heading>
        </div>
      </div>
      <div className="w-full">
        <CheckoutItemPreview cart={cart} />
      </div>

      {previousStepsCompleted && (
        <PaymentButton cart={cart} data-testid="submit-order-button" />
      )}
    </div>
  )
}

export default Review
