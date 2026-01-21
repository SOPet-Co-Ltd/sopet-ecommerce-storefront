"use client"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { convertToLocale } from "@/lib/helpers/money"
import { StoreCardShippingMethod, Cart } from "@/types/cart"
import { useState, useEffect } from "react"
import { RadioGroup } from "@headlessui/react"
import { CheckCircle2, Circle } from "lucide-react"
import { calculatePriceForShippingOption } from "@/lib/data/fulfillment"

// Mock logos component since we don't have assets yet
const CarrierLogos = () => (
  <div className="flex gap-2 items-center mt-2 opacity-80 grayscale">
    {/* Placeholder mainly for visual structure */}
    <span className="text-[10px] border px-1 rounded-sm text-blue-600 border-blue-200 font-bold">
      Thailand Post
    </span>
    <span className="text-[10px] border px-1 rounded-sm text-orange-600 border-orange-200 font-bold">
      Kerry
    </span>
    <span className="text-[10px] border px-1 rounded-sm text-yellow-600 border-yellow-200 font-bold">
      Flash
    </span>
    <span className="text-[10px] border px-1 rounded-sm text-red-600 border-red-200 font-bold">
      J&T
    </span>
  </div>
)

interface ShippingOptionDialogProps {
  isOpen: boolean
  onClose: () => void
  shippingMethods: StoreCardShippingMethod[]
  cart: Cart
  onSelectMethod: (methodId: string) => Promise<void>
}

export const ShippingOptionDialog = ({
  isOpen,
  onClose,
  shippingMethods,
  cart,
  onSelectMethod,
}: ShippingOptionDialogProps) => {
  const [selectedMethodId, setSelectedMethodId] = useState(
    cart.shipping_methods?.[0]?.shipping_option_id ||
      shippingMethods?.[0]?.id ||
      ""
  )
  const [loading, setLoading] = useState(false)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)

  // Fetch calculated prices if needed
  useEffect(() => {
    if (isOpen && shippingMethods?.length) {
      const methodsToCalculate = shippingMethods.filter(
        (sm) => sm.price_type === "calculated"
      )

      if (methodsToCalculate.length > 0) {
        setIsLoadingPrices(true)
        const promises = methodsToCalculate.map((sm) =>
          calculatePriceForShippingOption(sm.id, cart.id)
        )

        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              const val = (
                p as PromiseFulfilledResult<{
                  id: string
                  amount: number
                } | null>
              ).value
              if (val) {
                pricesMap[val.id] = val.amount
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }
  }, [isOpen, shippingMethods, cart.id])

  const handleConfirm = async () => {
    setLoading(true)
    await onSelectMethod(selectedMethodId)
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal heading="ตัวเลือกการจัดส่ง" onClose={onClose}>
      <div className="px-4 pb-4 flex flex-col gap-6">
        <RadioGroup value={selectedMethodId} onChange={setSelectedMethodId}>
          <div className="space-y-4">
            {shippingMethods.map((method) => {
              const price =
                method.price_type === "flat"
                  ? method.amount
                  : calculatedPricesMap[method.id]

              return (
                <RadioGroup.Option
                  key={method.id}
                  value={method.id}
                  className={({ checked }) =>
                    `relative flex cursor-pointer rounded-lg px-2 py-2 focus:outline-none ${
                      checked ? "" : ""
                    }`
                  }
                >
                  {({ checked }) => (
                    <div className="flex w-full items-start justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {checked ? (
                            <CheckCircle2 className="w-6 h-6 text-sop-primary-500 fill-white" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <RadioGroup.Label
                            as="p"
                            className={`font-bold  ${
                              checked ? "text-gray-900" : "text-gray-900"
                            }`}
                          >
                            {method.name}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="div"
                            className="text-sm text-gray-500"
                          >
                            <CarrierLogos />
                          </RadioGroup.Description>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">
                        {price !== undefined
                          ? convertToLocale({
                              amount: price,
                              currency_code: cart.currency_code,
                            })
                          : isLoadingPrices
                            ? "..."
                            : "-"}
                      </div>
                    </div>
                  )}
                </RadioGroup.Option>
              )
            })}
          </div>
        </RadioGroup>

        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            loading={loading}
            className="flex-1 rounded-full border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            className="flex-1 rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white"
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>
  )
}
