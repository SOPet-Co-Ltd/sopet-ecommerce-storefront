"use client"

import { useEffect } from "react"

import {
  clearAnonymousCheckoutHold,
  setAnonymousCart,
} from "@/lib/data/local-customer-cart"

export function ClearCheckoutCartHold() {
  useEffect(() => {
    clearAnonymousCheckoutHold()
    setAnonymousCart({ items: [] })
  }, [])

  return null
}
