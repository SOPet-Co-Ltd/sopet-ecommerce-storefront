"use client"

import dynamic from "next/dynamic"

import type { Cart } from "@/types/cart"
import type { CheckoutPageInitialData } from "@/lib/data/checkout-page"

const CheckoutFlowClient = dynamic(() => import("./CheckoutFlowClient"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[320px] items-center justify-center rounded-2xl bg-white/80 px-6 py-10"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-sop-neutral-gray-300">
        กำลังเตรียมหน้าชำระเงิน...
      </p>
    </div>
  ),
})

type CheckoutFlowClientBoundaryProps = {
  cart: Cart
  initialData: CheckoutPageInitialData
}

export default function CheckoutFlowClientBoundary({
  cart,
  initialData,
}: CheckoutFlowClientBoundaryProps) {
  return <CheckoutFlowClient cart={cart} initialData={initialData} />
}
