/**
 * Analytics Integration
 *
 * Google Analytics 4 - All e-commerce tracking and analytics
 * PostHog - Heatmaps, session recording, UX analysis
 *
 * Usage:
 *
 * 1. In React components (GA4):
 *    import { useAnalytics } from "@/lib/analytics"
 *    const { trackAddToCart, trackViewItem } = useAnalytics()
 *
 * 2. In non-React code (server actions, API routes):
 *    import * as gtag from "@/lib/analytics/gtag"
 *    gtag.addToCart({ currency: "THB", value: 100, items: [...] })
 *
 * 3. PostHog - Cart/Checkout tracking:
 *    import { tagCartSession, tagCheckoutSession, clearCartTags } from "@/lib/analytics/posthog"
 *    tagCartSession(cartValue, itemCount) // When items added to cart
 *    tagCheckoutSession("shipping") // When entering checkout
 *    clearCartTags() // After purchase or cart clear
 *
 * 4. PostHog - User identification (optional):
 *    import { identifyUser, resetUser } from "@/lib/analytics/posthog"
 *    identifyUser("user-123")
 *
 * 5. Scroll depth tracking:
 *    import { useScrollDepth } from "@/lib/analytics/useScrollDepth"
 *    useScrollDepth({ onDepthReached: trackScrollDepth })
 *
 * 6. Outbound link tracking:
 *    import { useOutboundLinks } from "@/lib/analytics/useOutboundLinks"
 *    useOutboundLinks({ onOutboundClick: trackOutboundClick })
 */

export * from "./gtag"
export * from "./useAnalytics"
export * from "./posthog"
export * from "./useScrollDepth"
export * from "./useOutboundLinks"
export * from "./usePostHogMobile"
