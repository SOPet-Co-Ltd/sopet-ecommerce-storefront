"use client"

import { useCallback, useRef, useState } from "react"

export function useSubmitOnce() {
  const inFlightRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runSubmit = useCallback(async (fn: () => Promise<void>) => {
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    setIsSubmitting(true)

    try {
      await fn()
    } finally {
      inFlightRef.current = false
      setIsSubmitting(false)
    }
  }, [])

  return { isSubmitting, runSubmit }
}
