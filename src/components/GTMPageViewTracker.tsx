"use client"

import { Suspense, useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import * as gtag from "@/lib/analytics/gtag"

function GTMPageViewTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    const search = searchParams.toString()
    const url = search ? `${pathname}?${search}` : pathname

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    gtag.pageview(url)
  }, [pathname, searchParams])

  return null
}

/**
 * Tracks page views on App Router client-side navigations via GTM dataLayer.
 */
export function GTMPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <GTMPageViewTrackerInner />
    </Suspense>
  )
}
