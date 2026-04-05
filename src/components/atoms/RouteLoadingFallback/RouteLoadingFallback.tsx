"use client"

import {
  useRouteLoadingRegistration,
  type RouteLoadingVariant,
} from "./RouteLoadingProvider"

type RouteLoadingFallbackProps = {
  variant?: RouteLoadingVariant
}

/**
 * Registers route loading UI with {@link RouteLoadingProvider} (in `providers.tsx`).
 * The overlay is portaled from the provider so it can fade out (200ms) after this
 * segment unmounts — `loading.tsx` alone cannot animate exit.
 */
export function RouteLoadingFallback({
  variant = "main",
}: RouteLoadingFallbackProps) {
  useRouteLoadingRegistration(variant)
  return null
}
