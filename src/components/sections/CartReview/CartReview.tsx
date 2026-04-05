"use client"

import CheckoutItemPreview from "@/components/molecules/CheckoutItemPreview/CheckoutItemPreview"
import { Cart } from "@/types/cart"
import { Heading, Text } from "@medusajs/ui"
import { ClipboardListIcon } from "@/icons"
import { useCheckoutPageData } from "@/app/[locale]/(checkout)/_providers/checkout-page-data-context"

const Review = ({ cart }: { cart: Cart }) => {
  const { shippingMethods, isLoading } = useCheckoutPageData()

  return (
    <div>
      <div className="bg-sop-base-white pt-2 px-4 ">
        <div className="flex flex-row items-center gap-2 border-b border-sop-neutral-gray-light py-2 ">
          <ClipboardListIcon className="w-[18px] md:w-[25px] h-[18px] md:h-[25px] text-sop-primary-500" />
          <Heading
            level="h2"
            className="sop-body-sm-regular md:sop-headline-sm-medium text-sop-primary-500"
          >
            คำสั่งซื้อสินค้า
          </Heading>
        </div>
      </div>
      <div className="w-full">
        {isLoading ? (
          <Text className="text-sm text-gray-500 px-4 py-4">
            กำลังโหลดตัวเลือกการจัดส่ง…
          </Text>
        ) : (
          <CheckoutItemPreview
            cart={cart}
            availableShippingMethods={shippingMethods}
          />
        )}
      </div>
    </div>
  )
}

export default Review
