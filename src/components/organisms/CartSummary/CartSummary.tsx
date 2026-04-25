"use client"
import { Button, Checkbox } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"

import { HttpTypes } from "@medusajs/types"
import { Cart } from "@/types/cart"
import { checkoutCustomerCartSelection } from "@/lib/data/customer-cart"
import { prepareGuestCheckout } from "@/lib/data/cart"
import { moveAnonymousCartItemsToCheckoutHoldByIds } from "@/lib/data/local-customer-cart"
import { useState } from "react"
import { toast } from "sonner"

interface CartSummaryProps {
  cart: HttpTypes.StoreCart | Cart
  locale?: string
  selectedCount?: number
  totalCount?: number
  isAllSelected?: boolean
  onSelectAll?: (checked: boolean) => void
  customTotal?: number
  selectedItemIds?: string[]
  isAnonymousCart?: boolean
  promotionCodes?: string[]
}

export const CartSummary = ({
  cart,
  locale = "th",
  selectedCount = 0,
  totalCount = 0,
  isAllSelected = false,
  onSelectAll,
  customTotal,
  selectedItemIds = [],
  isAnonymousCart = false,
  promotionCodes = [],
}: CartSummaryProps) => {
  const { total, subtotal, discount_total, currency_code } = cart || {}

  const [isLoading, setIsLoading] = useState(false)
  const hasCustomSelectedAmount = typeof customTotal === "number"
  const displaySelectedAmount = hasCustomSelectedAmount
    ? Math.max(customTotal, 0)
    : totalCount > 0 && selectedCount === totalCount
      ? (total ?? 0)
      : (subtotal ?? 0)
  const showCartDiscountBreakdown =
    (discount_total ?? 0) > 0 && selectedCount === totalCount

  const handleCheckout = async () => {
    if (selectedCount === 0) return
    setIsLoading(true)
    try {
      if (isAnonymousCart) {
        const items = (cart?.items ?? []).filter((i) =>
          selectedItemIds.includes(i.id)
        )
        const selectedItems = items.map((i) => ({
          variantId: i.variant_id as string,
          quantity: i.quantity ?? 1,
        }))
        moveAnonymousCartItemsToCheckoutHoldByIds(selectedItemIds)
        await prepareGuestCheckout(selectedItems, locale, promotionCodes)
      } else {
        await checkoutCustomerCartSelection(selectedItemIds, {
          countryCode: locale,
          promotionCodes,
        })
      }
    } catch (e) {
      console.error("[CartSummary] Checkout failed:", e)
      const message =
        e instanceof Error && e.message
          ? e.message
          : "ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-4">
      <div className="space-y-4">
        <div className="flex flex-col justify-between lg:items-end gap-1 text-sm">
          <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between">
            <span className="sop-body-md-regular text-sop-neutral-gray-300">
              สินค้า {selectedCount} รายการ
            </span>
            <span className="sop-body-md-regular text-sop-base-black">
              {convertToLocale({
                amount: displaySelectedAmount,
                currency_code,
              })}
            </span>
          </div>

          {showCartDiscountBreakdown && (
            <>
              <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between text-gray-900">
                <span>ส่วนลดร้านค้า</span>
                <span className="font-medium text-sop-base-black">
                  {convertToLocale({
                    amount: discount_total ?? 0,
                    currency_code,
                  })}
                </span>
              </div>
              <div className="w-full md:w-[300px] h-px bg-gray-100 my-1"></div>
            </>
          )}

          <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between">
            <span className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
              รวมทั้งสิ้น
            </span>
            <span className="sop-body-sm-regular md:sop-body-md-regular text-sop-base-white bg-sop-secondary-500 px-3 rounded-lg">
              {convertToLocale({
                amount: displaySelectedAmount,
                currency_code,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              size="lg"
              onChange={(e) => onSelectAll?.(e.target.checked)}
              label={
                <span className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
                  เลือกสินค้าทั้งหมด ({totalCount})
                </span>
              }
            />
          </div>
          {selectedCount > 0 ? (
            <div className="flex-1 max-w-[300px]">
              <Button
                onClick={handleCheckout}
                loading={isLoading}
                size="fill"
                className="py-1 sop-body-sm-medium"
              >
                ชำระเงิน ({selectedCount})
              </Button>
            </div>
          ) : (
            <div className="flex-1 max-w-[300px]">
              <Button disabled size="fill" className="py-1 sop-body-sm-medium">
                ชำระเงิน
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
