"use client"

import PaymentButton from "./PaymentButton"
import { CartItems } from "./CartItems"
import { CartSummary } from "@/components/organisms"

import { Cart } from "@/types/cart"

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
      <div className="w-full mb-6">
        <CartItems cart={cart} />
      </div>
      <div className="w-full mb-6 border rounded-xs p-4">
        <CartSummary cart={cart} />
      </div>

      {previousStepsCompleted && (
        <PaymentButton cart={cart} data-testid="submit-order-button" />
      )}
    </div>
  )
}

export default Review
