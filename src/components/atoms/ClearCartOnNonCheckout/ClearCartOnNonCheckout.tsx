"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { clearCart } from "@/lib/data/cart"

const CART_CLEARED_PATH_KEY = "sopet_cart_cleared_path"

/**
 * On non-checkout routes, clear the cart on Medusa (delete all line items) and remove the
 * local cart cookie, then refresh so the layout shows no cart. sessionStorage avoids
 * calling clearCart + refresh repeatedly for the same path.
 */
export default function ClearCartOnNonCheckout() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    const isCheckout = pathname?.includes("/checkout") ?? false
    if (isCheckout) {
      sessionStorage.removeItem(CART_CLEARED_PATH_KEY)
      return
    }
    const key = pathname ?? ""
    if (sessionStorage.getItem(CART_CLEARED_PATH_KEY) === key) return
    sessionStorage.setItem(CART_CLEARED_PATH_KEY, key)
    clearCart().then(() => router.refresh())
  }, [pathname, router])

  return null
}
