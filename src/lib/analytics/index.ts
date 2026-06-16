/**
 * Google Analytics Integration
 *
 * Usage:
 *
 * 1. In React components:
 *    import { useAnalytics } from "@/lib/analytics"
 *    const { trackAddToCart, trackViewItem } = useAnalytics()
 *
 * 2. In non-React code (server actions, API routes):
 *    import * as gtag from "@/lib/analytics/gtag"
 *    gtag.addToCart({ currency: "THB", value: 100, items: [...] })
 */

export * from "./gtag"
export * from "./useAnalytics"
