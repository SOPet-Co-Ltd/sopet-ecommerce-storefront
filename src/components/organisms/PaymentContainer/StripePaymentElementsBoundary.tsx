"use client"

import type { ReactNode } from "react"

export function StripePaymentElementsBoundary({
  children,
}: {
  cart?: unknown
  children: ReactNode
}) {
  return <>{children}</>
}
