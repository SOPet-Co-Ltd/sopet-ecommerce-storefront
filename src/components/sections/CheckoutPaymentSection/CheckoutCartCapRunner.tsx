"use client"

import { runCheckoutCartQuantityCapFromCookie } from "@/lib/data/cart"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const qtyCapInflight = new Set<string>()

type CheckoutCartCapRunnerProps = {
  cartId: string
  /** Fingerprint of line id:qty; skip server cap when unchanged since last successful run. */
  lineFingerprint: string
}

export function CheckoutCartCapRunner({
  cartId,
  lineFingerprint,
}: CheckoutCartCapRunnerProps) {
  const router = useRouter()

  useEffect(() => {
    if (!lineFingerprint) return

    const storageKey = `sopet_qty_cap_${cartId}`
    try {
      if (sessionStorage.getItem(storageKey) === lineFingerprint) return
    } catch {
      // ignore
    }

    const opKey = `${cartId}:${lineFingerprint}`
    if (qtyCapInflight.has(opKey)) return
    qtyCapInflight.add(opKey)

    let cancelled = false
    void runCheckoutCartQuantityCapFromCookie()
      .then((res) => {
        if (cancelled) return
        try {
          if (res.lineFingerprint) {
            sessionStorage.setItem(storageKey, res.lineFingerprint)
          }
        } catch {
          // ignore
        }
        if (res.mutated && res.lineFingerprint) {
          router.refresh()
        }
      })
      .finally(() => {
        qtyCapInflight.delete(opKey)
      })

    return () => {
      cancelled = true
    }
  }, [cartId, lineFingerprint, router])

  return null
}
