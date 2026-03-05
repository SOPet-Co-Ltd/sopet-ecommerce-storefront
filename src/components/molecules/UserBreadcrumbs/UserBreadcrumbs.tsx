"use client"

import { useParams, usePathname } from "next/navigation"
import { Breadcrumbs } from "@/components/atoms"
import { USER_SEGMENT_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

function getSegmentLabel(segment: string): string {
  return USER_SEGMENT_LABELS[segment]?.label ?? segment
}

/**
 * Matches a segment string against a parameterized route key and pattern.
 * For example: matchSegmentWithPattern("order_123", "[id]", { type: "prefix", value: "order_" })
 * Returns the route config label if matched, otherwise undefined.
 */
function matchSegmentWithPattern(
  actualSegment: string,
  routeKey: string,
  routeConfig: any
): string | undefined {
  // Only attempt pattern matching for parameterized routes like [id], [slug], etc.
  if (!routeKey.startsWith("[") || !routeKey.endsWith("]")) {
    return undefined
  }

  if (!routeConfig.pattern) {
    return undefined
  }

  const pattern = routeConfig.pattern

  if (pattern.type === "prefix") {
    if (actualSegment.startsWith(pattern.value)) {
      return routeConfig.label
    }
  } else if (pattern.type === "regex") {
    try {
      const regex = new RegExp(pattern.value)
      if (regex.test(actualSegment)) {
        return routeConfig.label
      }
    } catch (e) {
      console.warn(
        `Invalid regex pattern "${pattern.value}" for route key "${routeKey}":`,
        e
      )
    }
  }

  return undefined
}

export function UserBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const { locale } = useParams()
  const localeStr = String(locale ?? "")

  const pathWithoutLocale =
    localeStr.length > 0
      ? pathname.replace(new RegExp(`^/${localeStr}`), "") || "/"
      : pathname || "/"
  const isUserPath =
    pathWithoutLocale === "/user" || pathWithoutLocale.startsWith("/user/")

  const items: { label: string; path: string }[] = [
    { label: "หน้าแรก", path: "/user" },
  ]

  if (isUserPath && pathWithoutLocale !== "/user") {
    const segments = pathWithoutLocale
      .replace(/^\/user\/?/, "")
      .split("/")
      .filter(Boolean)
    let i = 0
    while (i < segments.length) {
      const segment = segments[i]
      const config = USER_SEGMENT_LABELS[segment]
      const parentPath = "/user/" + segments.slice(0, i + 1).join("/")
      const remainingPath = segments.slice(i + 1).join("/")

      if (config?.routes && remainingPath) {
        // Try exact match first (priority: exact matches override patterns)
        if (config.routes[remainingPath]) {
          items.push({ label: config.label, path: parentPath })
          items.push({
            label: config.routes[remainingPath].label,
            path: parentPath + "/" + remainingPath,
          })
          i += 1 + remainingPath.split("/").length
        } else {
          // Try pattern matching on the first segment of remainingPath
          const remainingSegments = remainingPath.split("/")
          const firstRemainingSegment = remainingSegments[0]
          let matchedLabel: string | undefined
          let matchedRouteKey: string | undefined

          // Look for a parameterized route key that matches this segment
          for (const routeKey in config.routes) {
            const routeConfig = config.routes[routeKey]
            const label = matchSegmentWithPattern(
              firstRemainingSegment,
              routeKey,
              routeConfig
            )
            if (label) {
              matchedLabel = label
              matchedRouteKey = routeKey
              break
            }
          }

          if (matchedLabel && matchedRouteKey) {
            items.push({ label: config.label, path: parentPath })
            items.push({
              label: matchedLabel,
              path: parentPath + "/" + remainingPath,
            })
            i += 1 + remainingSegments.length
          } else {
            // No exact or pattern match found
            items.push({
              label: config?.label ?? segment,
              path: parentPath,
            })
            i += 1
          }
        }
      } else {
        items.push({
          label: config?.label ?? segment,
          path: parentPath,
        })
        i += 1
      }
    }
  }

  return <Breadcrumbs items={items} className={cn(className)} />
}
