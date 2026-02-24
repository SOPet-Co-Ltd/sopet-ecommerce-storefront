"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DragEvent, SyntheticEvent, TransitionEvent } from "react"

export type BannerCarouselItem = {
  id: string
  image_url: string
  name?: string
  href?: string
  order: number
}

type UseBannerCarouselParams = {
  banners?: BannerCarouselItem[]
  autoSlideMs?: number
  dragThresholdPx?: number
  dragPollMs?: number
}

type UseBannerCarouselResult = {
  loopedBanners: BannerCarouselItem[]
  currentIndex: number
  displayIndex: number
  hasLoop: boolean
  isDragging: boolean
  dragOffsetPx: number
  isTransitionEnabled: boolean
  goToIndex: (index: number) => void
  startDrag: (clientX: number) => void
  moveDrag: (clientX: number) => void
  endDrag: () => void
  handleTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => void
  preventDragStart: (event: DragEvent) => void
  preventClickAfterDrag: (event: SyntheticEvent) => void
}

const DEFAULT_AUTO_SLIDE_MS = 5000
const DEFAULT_DRAG_THRESHOLD_PX = 48
const DEFAULT_DRAG_POLL_MS = 100

export const useBannerCarousel = ({
  banners = [],
  autoSlideMs = DEFAULT_AUTO_SLIDE_MS,
  dragThresholdPx = DEFAULT_DRAG_THRESHOLD_PX,
  dragPollMs = DEFAULT_DRAG_POLL_MS,
}: UseBannerCarouselParams): UseBannerCarouselResult => {
  const totalBanners = banners.length
  const hasLoop = totalBanners > 1

  const loopedBanners = useMemo(() => {
    if (!hasLoop) {
      return banners
    }

    const firstBanner = banners[0]
    const lastBanner = banners[totalBanners - 1]

    return [lastBanner, ...banners, firstBanner]
  }, [banners, hasLoop, totalBanners])

  const [displayIndex, setDisplayIndex] = useState(hasLoop ? 1 : 0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)

  const dragStartXRef = useRef<number | null>(null)
  const dragDeltaXRef = useRef(0)
  const didDragRef = useRef(false)

  const isDraggingRef = useRef(false)
  const nextAutoAtRef = useRef<number | null>(null)
  const autoTimerRef = useRef<number | null>(null)

  const transitionRafRef = useRef<number | null>(null)
  const transitionRaf2Ref = useRef<number | null>(null)

  const currentIndex = hasLoop
    ? ((displayIndex - 1 + totalBanners) % totalBanners) + 1
    : 1

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [])

  const clearTransitionRafs = useCallback(() => {
    if (transitionRafRef.current !== null) {
      window.cancelAnimationFrame(transitionRafRef.current)
      transitionRafRef.current = null
    }

    if (transitionRaf2Ref.current !== null) {
      window.cancelAnimationFrame(transitionRaf2Ref.current)
      transitionRaf2Ref.current = null
    }
  }, [])

  const scheduleAutoplay = useCallback(() => {
    clearAutoTimer()

    if (!hasLoop) {
      return
    }

    const now = Date.now()
    const nextAutoAt = nextAutoAtRef.current ?? now + autoSlideMs
    nextAutoAtRef.current = nextAutoAt

    if (isDraggingRef.current) {
      autoTimerRef.current = window.setTimeout(scheduleAutoplay, dragPollMs)
      return
    }

    const remainingMs = nextAutoAt - now

    if (remainingMs <= 0) {
      setDisplayIndex((prevIndex) => Math.min(prevIndex + 1, totalBanners + 1))
      nextAutoAtRef.current = Date.now() + autoSlideMs
      autoTimerRef.current = window.setTimeout(scheduleAutoplay, autoSlideMs)
      return
    }

    autoTimerRef.current = window.setTimeout(
      scheduleAutoplay,
      Math.min(remainingMs, dragPollMs)
    )
  }, [autoSlideMs, clearAutoTimer, dragPollMs, hasLoop, totalBanners])

  const resetAutoplayDeadline = useCallback(() => {
    if (!hasLoop) {
      return
    }

    nextAutoAtRef.current = Date.now() + autoSlideMs
  }, [autoSlideMs, hasLoop])

  const goToNext = useCallback(() => {
    if (!hasLoop) {
      return
    }

    setDisplayIndex((prevIndex) => Math.min(prevIndex + 1, totalBanners + 1))
  }, [hasLoop, totalBanners])

  const goToPrevious = useCallback(() => {
    if (!hasLoop) {
      return
    }

    setDisplayIndex((prevIndex) => Math.max(prevIndex - 1, 0))
  }, [hasLoop])

  const goToIndex = useCallback(
    (index: number) => {
      if (!hasLoop) {
        return
      }

      const targetDisplayIndex = index + 1
      if (targetDisplayIndex === displayIndex) {
        return
      }

      setDisplayIndex(targetDisplayIndex)
      resetAutoplayDeadline()
      scheduleAutoplay()
    },
    [displayIndex, hasLoop, resetAutoplayDeadline, scheduleAutoplay]
  )

  const startDrag = useCallback(
    (clientX: number) => {
      if (!hasLoop) {
        return
      }

      dragStartXRef.current = clientX
      dragDeltaXRef.current = 0
      didDragRef.current = false
      isDraggingRef.current = true
      setIsDragging(true)
      clearAutoTimer()
    },
    [clearAutoTimer, hasLoop]
  )

  const moveDrag = useCallback((clientX: number) => {
    if (dragStartXRef.current === null) {
      return
    }

    const deltaX = clientX - dragStartXRef.current
    dragDeltaXRef.current = deltaX
    setDragOffsetPx(deltaX)

    if (Math.abs(deltaX) > 8) {
      didDragRef.current = true
    }
  }, [])

  const endDrag = useCallback(() => {
    if (dragStartXRef.current === null) {
      return
    }

    const deltaX = dragDeltaXRef.current
    let didManualSlideChange = false

    if (Math.abs(deltaX) >= dragThresholdPx) {
      didManualSlideChange = true

      if (deltaX < 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    dragStartXRef.current = null
    dragDeltaXRef.current = 0
    setDragOffsetPx(0)
    isDraggingRef.current = false
    setIsDragging(false)

    if (didManualSlideChange) {
      resetAutoplayDeadline()
    }

    scheduleAutoplay()
  }, [
    dragThresholdPx,
    goToNext,
    goToPrevious,
    resetAutoplayDeadline,
    scheduleAutoplay,
  ])

  const jumpWithoutAnimation = useCallback(
    (targetIndex: number) => {
      clearTransitionRafs()
      setIsTransitionEnabled(false)
      setDragOffsetPx(0)
      setDisplayIndex(targetIndex)

      transitionRafRef.current = window.requestAnimationFrame(() => {
        transitionRaf2Ref.current = window.requestAnimationFrame(() => {
          setIsTransitionEnabled(true)
          transitionRafRef.current = null
          transitionRaf2Ref.current = null
        })
      })
    },
    [clearTransitionRafs]
  )

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      if (!hasLoop || !isTransitionEnabled) {
        return
      }

      if (displayIndex <= 0) {
        jumpWithoutAnimation(totalBanners)
        return
      }

      if (displayIndex >= totalBanners + 1) {
        jumpWithoutAnimation(1)
      }
    },
    [
      displayIndex,
      hasLoop,
      isTransitionEnabled,
      jumpWithoutAnimation,
      totalBanners,
    ]
  )

  const preventDragStart = useCallback((event: DragEvent) => {
    event.preventDefault()
  }, [])

  const preventClickAfterDrag = useCallback((event: SyntheticEvent) => {
    if (!didDragRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    didDragRef.current = false
  }, [])

  useEffect(() => {
    setDisplayIndex(hasLoop ? 1 : 0)
    setDragOffsetPx(0)
    setIsDragging(false)
    setIsTransitionEnabled(true)

    dragStartXRef.current = null
    dragDeltaXRef.current = 0
    didDragRef.current = false

    isDraggingRef.current = false
    clearAutoTimer()
    clearTransitionRafs()

    if (hasLoop) {
      nextAutoAtRef.current = Date.now() + autoSlideMs
      scheduleAutoplay()
    } else {
      nextAutoAtRef.current = null
    }

    return () => {
      clearAutoTimer()
      clearTransitionRafs()
    }
  }, [
    autoSlideMs,
    clearAutoTimer,
    clearTransitionRafs,
    hasLoop,
    scheduleAutoplay,
    totalBanners,
  ])

  return {
    loopedBanners,
    currentIndex,
    displayIndex,
    hasLoop,
    isDragging,
    dragOffsetPx,
    isTransitionEnabled,
    goToIndex,
    startDrag,
    moveDrag,
    endDrag,
    handleTransitionEnd,
    preventDragStart,
    preventClickAfterDrag,
  }
}
