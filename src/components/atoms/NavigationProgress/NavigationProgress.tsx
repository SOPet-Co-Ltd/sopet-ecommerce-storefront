"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"

/**
 * Indeterminate top bar on internal link press; clears when the URL updates.
 * Pairs with route `loading.tsx` so navigation always shows immediate feedback.
 */
function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlKey = `${pathname}?${searchParams.toString()}`
  const [active, setActive] = useState(false)
  const urlKeyRef = useRef(urlKey)

  useEffect(() => {
    urlKeyRef.current = urlKey
    setActive(false)
  }, [urlKey])

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => setActive(false), 15000)
    return () => window.clearTimeout(t)
  }, [active])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const a = (e.target as Element | null)?.closest?.("a[href]")
      if (!a) return
      const href = a.getAttribute("href")
      if (!href || href.startsWith("#")) return
      if (a.getAttribute("target") === "_blank" || a.hasAttribute("download")) {
        return
      }
      let nextUrl: URL
      try {
        nextUrl = new URL(href, window.location.origin)
      } catch {
        return
      }
      if (nextUrl.origin !== window.location.origin) return
      const nextKey = `${nextUrl.pathname}?${nextUrl.searchParams.toString()}`
      if (nextKey === urlKeyRef.current) return
      setActive(true)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true)
  }, [])

  if (!active) return null

  return (
    <div
      className="sop-nav-progress pointer-events-none fixed inset-x-0 top-0 z-99990 h-[3px] overflow-hidden"
      aria-hidden
    />
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
