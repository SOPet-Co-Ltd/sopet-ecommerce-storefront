"use client"

import { useEffect } from "react"
import { initPostHog } from "@/lib/analytics/posthog"
import { usePostHogMobile } from "@/lib/analytics/usePostHogMobile"

/**
 * PostHog Provider Component
 * Initializes PostHog on client-side mount (production only)
 * Automatically tags mobile sessions for mobile-specific analysis
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  // Tag mobile sessions for mobile-specific UX analysis
  usePostHogMobile()

  return <>{children}</>
}
