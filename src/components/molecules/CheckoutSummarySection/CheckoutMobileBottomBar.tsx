"use client"

import { Button } from "@/components/atoms"
import { useCheckoutSubmit } from "@/lib/checkout/use-checkout-submit"
import { formatPrice, useCheckoutTotals } from "./use-checkout-totals"

export function CheckoutMobileBottomBar() {
  const { finalPrice } = useCheckoutTotals()
  const { submit, isSubmitting } = useCheckoutSubmit()

  return (
    <div className="block lg:hidden">
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
            disabled={isSubmitting}
            onClick={() => void submit()}
          >
            ชำระเงิน
          </Button>
        </div>
      </div>
    </div>
  )
}
