"use client"

import { useEffect, useRef } from "react"

interface UseScrollDepthOptions {
  onDepthReached?: (depth: number) => void
  thresholds?: number[] // Default: [25, 50, 75, 90, 100]
}

/**
 * Hook to track scroll depth on a page
 *
 * Usage:
 * ```tsx
 * import { useScrollDepth } from "@/lib/analytics/useScrollDepth"
 * import { useAnalytics } from "@/lib/analytics"
 *
 * function MyPage() {
 *   const { trackScrollDepth } = useAnalytics()
 *
 *   useScrollDepth({
 *     onDepthReached: trackScrollDepth
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useScrollDepth({
  onDepthReached,
  thresholds = [25, 50, 75, 90, 100],
}: UseScrollDepthOptions = {}) {
  const reachedThresholds = useRef<Set<number>>(new Set())

  useEffect(() => {
    // Reset on mount
    reachedThresholds.current.clear()

    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      // Calculate scroll percentage
      const scrollableHeight = documentHeight - windowHeight
      const scrollPercentage = (scrollTop / scrollableHeight) * 100

      // Check each threshold
      thresholds.forEach((threshold) => {
        if (
          scrollPercentage >= threshold &&
          !reachedThresholds.current.has(threshold)
        ) {
          reachedThresholds.current.add(threshold)
          onDepthReached?.(threshold)
        }
      })
    }

    // Attach scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [onDepthReached, thresholds])
}
