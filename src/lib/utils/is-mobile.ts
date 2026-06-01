"use client"

import { useEffect, useState } from "react"

// SSR-safe snapshot — returns false on server, real value on client
const getIsMobile = (breakpoint: number): boolean => {
  if (typeof window === "undefined") return false
  return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
}

export const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(() => getIsMobile(breakpoint)) // lazy init avoids SSR/client hydration mismatch

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`) // fires only at boundary, not every resize pixel

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    setIsMobile(mql.matches)
    mql.addEventListener("change", handler)

    return () => mql.removeEventListener("change", handler)
  }, [breakpoint])

  return isMobile
}
