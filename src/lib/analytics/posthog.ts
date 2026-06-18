/**
 * PostHog Integration - UX Analytics & Heatmaps
 *
 * Features enabled:
 * - Click heatmaps
 * - Scroll heatmaps
 * - Session recordings
 * - Rage clicks detection
 * - Dead clicks detection
 * - Mobile interaction tracking
 */

import posthog from "posthog-js"

let isInitialized = false

export const initPostHog = () => {
  // Only initialize once and only in production
  if (
    typeof window === "undefined" ||
    isInitialized ||
    process.env.NODE_ENV !== "production"
  ) {
    return
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

  if (!apiKey) {
    console.warn("PostHog: API key not found. Skipping initialization.")
    return
  }

  try {
    posthog.init(apiKey, {
      api_host: host,

      // Disable automatic event capture (using GA4 for events)
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,

      // Session recording configuration
      session_recording: {
        // Enable all UX tracking features
        maskAllInputs: true, // Mask all input fields for privacy
        maskTextSelector: "[data-sensitive]", // Mask elements with data-sensitive attribute

        // Sampling: 25% of sessions (stays in free tier)
        // Change to 1.0 for 100% recording (will cost ~$67/month for 20k sessions)
        sampleRate: 0.25,

        // Mobile-specific settings
        recordCrossOriginIframes: false,
      },

      // Enable advanced features
      advanced_disable_decide: false, // Needed for heatmaps

      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          posthog.debug()
        }
      },
    })

    isInitialized = true
    console.log(
      "PostHog initialized: Session recording, heatmaps, rage/dead click detection enabled"
    )
  } catch (error) {
    console.error("PostHog initialization failed:", error)
  }
}

/**
 * Get PostHog instance (if initialized)
 */
export const getPostHog = () => {
  if (!isInitialized) {
    return null
  }
  return posthog
}

/**
 * Identify user (use sparingly, only if needed for session replay filtering)
 */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  const ph = getPostHog()
  if (ph) {
    ph.identify(userId, traits)
  }
}

/**
 * Reset user identity (e.g., on logout)
 */
export const resetUser = () => {
  const ph = getPostHog()
  if (ph) {
    ph.reset()
  }
}

/**
 * Tag session for cart abandonment analysis
 * Call this when user adds items to cart
 */
export const tagCartSession = (cartValue?: number, itemCount?: number) => {
  const ph = getPostHog()
  if (ph) {
    ph.setPersonPropertiesForFlags({
      has_cart_items: true,
      cart_value: cartValue,
      cart_item_count: itemCount,
    })
  }
}

/**
 * Tag session for checkout analysis
 * Call this when user starts checkout
 */
export const tagCheckoutSession = (step?: string) => {
  const ph = getPostHog()
  if (ph) {
    ph.setPersonPropertiesForFlags({
      in_checkout: true,
      checkout_step: step || "started",
    })
  }
}

/**
 * Clear cart/checkout tags (after purchase or cart clear)
 */
export const clearCartTags = () => {
  const ph = getPostHog()
  if (ph) {
    ph.setPersonPropertiesForFlags({
      has_cart_items: false,
      in_checkout: false,
      cart_value: 0,
      cart_item_count: 0,
    })
  }
}

/**
 * Tag mobile sessions for mobile-specific analysis
 */
export const tagMobileSession = () => {
  const ph = getPostHog()
  if (ph && typeof window !== "undefined") {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    const isTablet =
      /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768

    ph.setPersonPropertiesForFlags({
      is_mobile: isMobile && !isTablet,
      is_tablet: isTablet,
      device_type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    })
  }
}
