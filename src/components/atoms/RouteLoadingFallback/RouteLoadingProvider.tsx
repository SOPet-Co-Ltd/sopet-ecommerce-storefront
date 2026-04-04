"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  RouteLoadingSpinnerBlock,
  type RouteLoadingVariant,
} from "./RouteLoadingSpinnerBlock"

export const ROUTE_LOADING_TRANSITION_MS = 200

export type { RouteLoadingVariant }

type RouteLoadingContextValue = {
  enter: (variant: RouteLoadingVariant) => void
  leave: () => void
}

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null)

export function useRouteLoadingRegistration(
  variant: RouteLoadingVariant
): void {
  const ctx = useContext(RouteLoadingContext)

  useEffect(() => {
    if (!ctx) return
    ctx.enter(variant)
    return () => {
      ctx.leave()
    }
  }, [ctx, variant])
}

export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [opaque, setOpaque] = useState(false)
  const [variant, setVariant] = useState<RouteLoadingVariant>("main")
  const depthRef = useRef(0)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const enter = useCallback(
    (v: RouteLoadingVariant) => {
      clearExitTimer()
      setVariant(v)
      depthRef.current += 1
      setMounted(true)
      setOpaque(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpaque(true)
        })
      })
    },
    [clearExitTimer]
  )

  const leave = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1)
    if (depthRef.current > 0) return

    setOpaque(false)
    clearExitTimer()
    exitTimerRef.current = setTimeout(() => {
      setMounted(false)
      exitTimerRef.current = null
    }, ROUTE_LOADING_TRANSITION_MS)
  }, [clearExitTimer])

  useEffect(() => {
    return () => clearExitTimer()
  }, [clearExitTimer])

  useEffect(() => {
    if (!mounted) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted])

  const value = useMemo(() => ({ enter, leave }), [enter, leave])

  return (
    <RouteLoadingContext.Provider value={value}>
      {children}
      {mounted ? (
        <div
          className={`fixed inset-0 z-99980 flex flex-col items-center justify-center gap-4 bg-sop-base-white/96 backdrop-blur-sm px-6 transition-opacity ease-out ${opaque ? "opacity-100" : "opacity-0"}`}
          style={{
            transitionDuration: `${ROUTE_LOADING_TRANSITION_MS}ms`,
          }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <RouteLoadingSpinnerBlock variant={variant} />
        </div>
      ) : null}
    </RouteLoadingContext.Provider>
  )
}
