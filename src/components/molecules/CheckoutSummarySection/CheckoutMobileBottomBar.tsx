"use client"

import { Button } from "@/components/atoms"
import { useCheckoutSubmit } from "@/lib/checkout/use-checkout-submit"
import { useParams, useRouter } from "next/navigation"
import { formatPrice, useCheckoutTotals } from "./use-checkout-totals"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"

export function CheckoutMobileBottomBar() {
  const { finalPrice, subtotal, platformDiscount, vendorDiscount } =
    useCheckoutTotals()
  const { submit, isSubmitting } = useCheckoutSubmit()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || "th"

  // Check if order price (excluding shipping) is valid
  const orderPriceWithoutShipping =
    subtotal - (platformDiscount + vendorDiscount)
  const hasInvalidOrderPrice = orderPriceWithoutShipping <= 0

  const handleSubmit = async () => {
    console.log("[CheckoutMobileBottomBar] handleSubmit called")
    const res = await submit()
    console.log("[CheckoutMobileBottomBar] submit result:", res)
    if (res.ok) {
      router.replace(`/${locale}/payment/${res.sessionId}`)
    }
  }

  return (
    <div className="block md:hidden">
      <div className="px-sop-32px py-sop-12px rounded-tl-sop-20px rounded-tr-sop-20px bg-sop-base-white flex justify-between items-center mt-14">
        <div className="flex flex-col">
          <label className="sop-body-sm-medium text-sop-neutral-gray-300">
            ยอดชำระเงิน
          </label>
          <label className="text-sop-secondary-600">
            {formatPrice(finalPrice)}
          </label>
        </div>
        <div className="flex flex-col items-end">
          <Button
            className="w-fit"
            variant="primary"
            size="lg"
            type="button"
            loading={isSubmitting}
            disabled={isSubmitting || hasInvalidOrderPrice}
            onClick={() => void handleSubmit()}
          >
            ชำระเงิน
          </Button>
        </div>
      </div>
    </div>
  )
}
