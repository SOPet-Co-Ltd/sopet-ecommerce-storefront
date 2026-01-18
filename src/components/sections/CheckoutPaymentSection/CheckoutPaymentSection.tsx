"use client"

import { useState, useEffect } from "react"
import { Wallet, CreditCard, Plus, Check } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { initiatePaymentSession } from "@/lib/data/cart"

type CheckoutPaymentSectionProps = {
  cart: Cart | null
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
}

export const CheckoutPaymentSection = ({
  cart,
  paymentMethods,
}: CheckoutPaymentSectionProps) => {
  const [method, setMethod] = useState<"qrcode" | "card">("card")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (cart?.payment_collection?.payment_sessions?.length) {
      const activeSession = cart.payment_collection.payment_sessions.find(
        (s) => s.status === "pending"
      )
      if (activeSession) {
        if (activeSession.provider_id === "stripe") {
          setMethod("card")
        } else {
          setMethod("qrcode")
        }
      }
    }
  }, [cart])

  const handleMethodChange = async (newMethod: "qrcode" | "card") => {
    setMethod(newMethod)
    setIsLoading(true)

    let providerId = ""
    if (newMethod === "card") {
      providerId =
        paymentMethods?.find((p) => p.id === "stripe")?.id || "stripe"
    } else {
      providerId =
        paymentMethods?.find((p) => p.id !== "stripe")?.id || "manual"
    }

    if (cart && providerId) {
      try {
        await initiatePaymentSession(cart, {
          provider_id: providerId,
        })
      } catch (e) {
        console.error(e)
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col gap-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Text className="text-purple-600 font-bold">Processing...</Text>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-sop-neutral-gray-light pb-4">
        <Wallet className="w-6 h-6 text-purple-600" />
        <Heading level="h2" className="text-xl text-purple-600 font-bold">
          วิธีการชำระเงิน
        </Heading>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => handleMethodChange("qrcode")}
        >
          <div
            className={clx(
              "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5",
              method === "qrcode" ? "border-purple-600" : "border-gray-300"
            )}
          >
            {method === "qrcode" && (
              <div className="w-3 h-3 rounded-full bg-purple-600" />
            )}
          </div>
          <Text className="text-gray-900 font-medium">QR Code</Text>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => handleMethodChange("card")}
          >
            <div
              className={clx(
                "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5",
                method === "card" ? "border-purple-600" : "border-gray-300"
              )}
            >
              {method === "card" && (
                <div className="w-3 h-3 rounded-full bg-purple-600" />
              )}
            </div>
            <Text className="text-gray-900 font-medium">
              บัตรเครดิต/บัตรเดบิต
            </Text>
          </div>

          {method === "card" && (
            <div className="pl-8 flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 border-b border-sop-neutral-gray-light hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-5 bg-orange-100 rounded flex items-center justify-center relative overflow-hidden">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-80 -mr-2 z-10"></div>
                    <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80"></div>
                  </div>
                  <Text className="text-gray-700">****9999</Text>
                </div>
                <Check className="w-4 h-4 text-purple-600" />
              </div>

              <Button
                variant="secondary"
                className="w-fit flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 px-4 py-2 h-auto rounded-full"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มบัตร</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
