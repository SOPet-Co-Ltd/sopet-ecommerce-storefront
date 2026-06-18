"use client"

import { useEffect } from "react"

interface UseOutboundLinksOptions {
  onOutboundClick?: (url: string, linkText?: string) => void
}

/**
 * Hook to automatically track outbound link clicks
 *
 * Usage:
 * ```tsx
 * import { useOutboundLinks } from "@/lib/analytics/useOutboundLinks"
 * import { useAnalytics } from "@/lib/analytics"
 *
 * function MyComponent() {
 *   const { trackOutboundClick } = useAnalytics()
 *
 *   useOutboundLinks({
 *     onOutboundClick: trackOutboundClick
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useOutboundLinks({
  onOutboundClick,
}: UseOutboundLinksOptions = {}) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest("a")

      if (!link) return

      const href = link.href
      const linkText = link.textContent?.trim()

      // Check if it's an external link
      const isExternal =
        href &&
        (href.startsWith("http://") || href.startsWith("https://")) &&
        !href.includes(window.location.hostname)

      if (isExternal) {
        onOutboundClick?.(href, linkText)
      }
    }

    document.addEventListener("click", handleClick)

    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [onOutboundClick])
}
