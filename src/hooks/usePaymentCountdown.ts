"use client"

import { useEffect, useState } from "react"

/**
 * Derives remaining time from a fixed expiry instant each tick (avoids drift vs. decrement-only timers).
 */
export function usePaymentCountdown(expiresAtMs: number | null): {
  remainingSeconds: number | null
  isExpired: boolean
} {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    () => {
      if (expiresAtMs == null) {
        return null
      }
      return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
    }
  )

  useEffect(() => {
    if (expiresAtMs == null) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      setRemainingSeconds(
        Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      )
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresAtMs])

  if (expiresAtMs == null || remainingSeconds === null) {
    return { remainingSeconds: null, isExpired: false }
  }

  return {
    remainingSeconds,
    isExpired: remainingSeconds <= 0,
  }
}
