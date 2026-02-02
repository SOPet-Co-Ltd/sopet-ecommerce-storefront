"use client"

import PaymentButton from "./PaymentButton"
import CheckoutItemPreview from "@/components/molecules/CheckoutItemPreview/CheckoutItemPreview"
import { StoreCardShippingMethod, Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { ClipboardList } from "lucide-react"

const Review = ({
  cart,
  shippingMethods,
  customer,
}: {
  cart: Cart
  shippingMethods: StoreCardShippingMethod[]
  customer?: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div>
      <div className="bg-sop-base-white pt-2 px-4 ">
        <div className="flex flex-row items-center gap-2 border-b border-sop-neutral-gray-light py-2 ">
          <ClipboardList className="text-sop-primary-500 w-6 h-6" />
          <Heading
            level="h2"
            className="sop-headline-sm-medium text-sop-primary-500"
          >
            คำสั่งซื้อสินค้า
          </Heading>
        </div>
      </div>
      <div className="w-full">
        <CheckoutItemPreview
          cart={cart}
          availableShippingMethods={shippingMethods}
        />
      </div>
    </div>
  )
}

export default Review
