"use client"

import { useEffect } from "react"
import { tagMobileSession } from "@/lib/analytics/posthog"

/**
 * Hook to automatically tag mobile sessions for mobile-specific analysis
 *
 * Usage:
 * ```tsx
 * import { usePostHogMobile } from "@/lib/analytics/usePostHogMobile"
 *
 * function Layout() {
 *   usePostHogMobile()
 *   return <div>...</div>
 * }
 * ```
 */
export function usePostHogMobile() {
  useEffect(() => {
    // Tag session with device information
    tagMobileSession()
  }, [])
}
