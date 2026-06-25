"use client"

import { useAnalytics, useOutboundLinks, useScrollDepth } from "@/lib/analytics"

/**
 * Site-wide scroll depth and outbound link click tracking.
 */
export function AnalyticsBehaviorTracker() {
  const { trackScrollDepth, trackOutboundClick } = useAnalytics()

  useScrollDepth({ onDepthReached: trackScrollDepth })
  useOutboundLinks({ onOutboundClick: trackOutboundClick })

  return null
}
