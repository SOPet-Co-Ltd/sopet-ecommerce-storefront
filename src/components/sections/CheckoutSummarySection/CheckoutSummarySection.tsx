"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { convertToLocale } from "@/lib/helpers/money"
import { Text, clx } from "@medusajs/ui"
import { placeOrder } from "@/lib/data/cart"
import { useState } from "react"

type CheckoutSummarySectionProps = {
  cart: Cart | null
}

export const CheckoutSummarySection = ({
  cart,
}: CheckoutSummarySectionProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!cart) return null

  const subtotal = cart.subtotal || 0
  const shippingTotal = cart.shipping_total || 0
  const discountTotal = cart.discount_total || 0
  const total = cart.total || subtotal + shippingTotal - discountTotal
  const currencyCode = cart.currency_code || "thb"

  const handlePayment = async () => {
    setSubmitting(true)
    try {
      await placeOrder()
    } catch (e: unknown) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex flex-col gap-4 w-full md:w-1/2 ml-auto">
        <div className="flex justify-between items-center text-gray-900">
          <Text className="font-normal">รายการสั่งซื้อทั้งหมด</Text>
          <Text className="font-medium">
            {convertToLocale({
              amount: subtotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        <div className="flex justify-between items-center text-gray-900">
          <Text className="font-normal">ค่าจัดส่ง</Text>
          <Text className="font-medium">
            {convertToLocale({
              amount: shippingTotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <Text className="font-normal">ส่วนลด</Text>
            <Text className="font-medium">
              -{" "}
              {convertToLocale({
                amount: discountTotal,
                currency_code: currencyCode,
              })}
            </Text>
          </div>
        )}

        <div className="border-b border-gray-100 my-2" />

        <div className="flex justify-between items-center">
          <Text className="font-normal text-gray-900">ยอดชำระเงินทั้งหมด</Text>
          <div className="bg-red-400 text-white px-4 py-1 rounded-xl font-bold text-lg shadow-sm">
            {convertToLocale({
              amount: total,
              currency_code: currencyCode,
            })}
          </div>
        </div>

        <Button
          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full py-3 h-auto text-lg font-bold mt-4 shadow-md transition-all"
          onClick={handlePayment}
          loading={submitting}
          disabled={submitting}
        >
          ชำระเงิน
        </Button>
        {error && (
          <Text className="text-red-500 text-center text-sm">{error}</Text>
        )}
      </div>
    </div>
  )
}
