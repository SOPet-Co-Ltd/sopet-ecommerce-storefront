"use client"

import { Button, Checkbox, Input } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"

import { HttpTypes } from "@medusajs/types"
import { Cart } from "@/types/cart"

interface CartSummaryProps {
  cart: HttpTypes.StoreCart | Cart
  selectedCount?: number
  totalCount?: number
  isAllSelected?: boolean
  onSelectAll?: (checked: boolean) => void
}

export const CartSummary = ({
  cart,
  selectedCount = 0,
  totalCount = 0,
  isAllSelected = false,
  onSelectAll,
}: CartSummaryProps) => {
  const {
    total,
    subtotal,
    discount_total,
    shipping_total,
    tax_total,
    currency_code,
  } = cart || {}

  return (
    <div className="w-full bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-4">
      <div className="space-y-4">
        <div className="flex flex-col justify-between lg:items-end gap-1 text-sm">
          <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between">
            <span className="text-gray-500">สินค้า {selectedCount} รายการ</span>
            <span className="font-medium text-gray-900">
              {convertToLocale({ amount: subtotal || 0, currency_code })}
            </span>
          </div>

          {discount_total > 0 && (
            <>
              <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between text-gray-900">
                <span>ส่วนลดร้านค้า</span>
                <span className="font-medium">
                  {convertToLocale({ amount: discount_total, currency_code })}
                </span>
              </div>
              <div className="w-full md:w-[300px] h-px bg-gray-100 my-1"></div>
            </>
          )}

          <div className="flex items-center gap-4 min-w-[50%] md:min-w-[300px] justify-between">
            <span className="font-medium text-gray-900">รวมทั้งสิ้น</span>
            {discount_total > 0 ? (
              <span className="font-bold text-white bg-sop-secondary-500 rounded-lg px-2 py-0.5 text-lg">
                {convertToLocale({ amount: total || 0, currency_code })}
              </span>
            ) : (
              <span className="font-bold text-gray-900 text-lg">
                {convertToLocale({ amount: total || 0, currency_code })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onChange={(e) => onSelectAll?.(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
              เลือกสินค้าทั้งหมด ({totalCount})
            </span>
          </div>
          <Button className="flex-1 max-w-[300px] rounded-full font-bold bg-sop-primary-500 hover:bg-sop-primary-600 text-white shadow-sop-primary h-10 text-base">
            ชำระเงิน
          </Button>
        </div>
      </div>
    </div>
  )
}
