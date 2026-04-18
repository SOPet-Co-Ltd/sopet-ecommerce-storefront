"use client"

import { useEffect } from "react"

import { clearAnonymousCheckoutHold } from "@/lib/data/local-customer-cart"

export function ClearCheckoutCartHold() {
  useEffect(() => {
    clearAnonymousCheckoutHold()
  }, [])

  return null
}
