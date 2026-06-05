"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { BackIcon, LineSquareCustomIcon, QrAddLineOAIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/utils/is-mobile"

const LINE_OA_URL = "https://line.me/R/ti/p/@sopet"
const LINE_ID = "@sopet"
const TRANSITION_DURATION_MS = 500
const TRANSITION_EASE = "cubic-bezier(0.4,0,0.2,1)"

// Measures and tracks the card's natural (collapsed) pixel width so CSS can animate it.
function useCollapsedWidth(cardRef: React.RefObject<HTMLDivElement | null>) {
  const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null)
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const measure = () => {
      const prev = card.style.width
      card.style.width = "" // Reset to intrinsic width
      setCollapsedWidth(card.getBoundingClientRect().width)
      card.style.width = prev // Restore expanded width if open
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [cardRef])
  return collapsedWidth
}

// Hides the button when it overlaps the page header or footer.
function useOverlapDetection(
  buttonRef: React.RefObject<HTMLDivElement | null>
) {
  const [overlapping, setOverlapping] = useState(false)
  useEffect(() => {
    const button = buttonRef.current
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")
    if (!button || !header || !footer) return

    let rafId = 0
    const intersects = (a: DOMRect, b: DOMRect) =>
      a.top < b.bottom &&
      a.bottom > b.top &&
      a.left < b.right &&
      a.right > b.left

    const check = () => {
      const br = button.getBoundingClientRect()
      setOverlapping(
        intersects(br, header.getBoundingClientRect()) ||
          intersects(br, footer.getBoundingClientRect())
      )
    }
    // Coalesce rapid scroll/resize events into one layout read per frame
    const schedule = () => {
      cancelAnimationFrame(rafId)
      rafId = window.requestAnimationFrame(check)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(button)
    ro.observe(header)
    ro.observe(footer)
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [buttonRef])
  return overlapping
}

const ChatWithAdminFloatingButton = () => {
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const lineButtonRef = useRef<HTMLButtonElement | null>(null)
  const backButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)

  const isMobile = useIsMobile()

  const collapsedWidth = useCollapsedWidth(cardRef)
  const overlapping = useOverlapDetection(buttonRef)

  // Close panel on Escape key
  useEffect(() => {
    if (!isQrOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsQrOpen(false)
        lineButtonRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isQrOpen])

  // Focus management: focus back button when opening, focus LINE button when closing
  useEffect(() => {
    if (isQrOpen) {
      backButtonRef.current?.focus()
    }
  }, [isQrOpen])

  // Stagger: opening = width → height; closing = height → width
  const widthTransition =
    collapsedWidth == null
      ? undefined
      : `width ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASE} ${isQrOpen ? "0ms" : "400ms"}`

  const heightTransition = (() => {
    const props = "grid-template-rows, opacity, margin-top"
    const delay = isQrOpen ? "400ms" : "0ms"
    return props
      .split(", ")
      .map(
        (p) => `${p} ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASE} ${delay}`
      )
      .join(", ")
  })()

  const statusDot = (hidden?: string) => (
    <div
      aria-hidden="true"
      className={cn(
        hidden,
        "w-2.5 h-2.5 rounded-full border border-solid border-sop-base-white bg-sop-system-success-400"
      )}
    />
  )

  return (
    <div
      ref={buttonRef}
      className={cn(
        "fixed z-20 bottom-4 right-2 md:bottom-10 md:right-10 transition-all duration-300 ease-out",
        overlapping
          ? "opacity-0 scale-75 pointer-events-none"
          : "opacity-100 scale-100"
      )}
    >
      <div
        ref={cardRef}
        role="region"
        aria-label="ติดต่อแอดมินผ่าน LINE"
        className={cn(
          "bg-sop-neutral-whitealpha-900 px-5 py-4 flex flex-col overflow-hidden",
          "rounded-tl-sop-28px rounded-tr-sop-28px rounded-bl-sop-28px rounded-br-sop-4px",
          "ring-1 ring-inset ring-sop-neutral-whitealpha-300",
          "backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04),inset_1px_1px_24px_rgba(255,255,255,0.4)]"
        )}
        style={{
          width: isQrOpen
            ? "320px"
            : collapsedWidth
              ? `${collapsedWidth}px`
              : undefined,
          transition: widthTransition,
        }}
      >
        {/* Header row: back button (when open) + LINE button */}
        <div className="flex items-center gap-2.5 transition-all duration-300 ease-out">
          {isQrOpen && (
            <button
              ref={backButtonRef}
              type="button"
              onClick={() => setIsQrOpen(false)}
              aria-label="ปิดรายละเอียด LINE"
              className="flex items-center justify-center cursor-pointer"
            >
              <BackIcon size={24} />
            </button>
          )}
          <button
            ref={lineButtonRef}
            type="button"
            onClick={() => setIsQrOpen(true)}
            disabled={isQrOpen}
            aria-disabled={isQrOpen}
            aria-label="แสดงรายละเอียด LINE สำหรับติดต่อแอดมิน"
            aria-expanded={isQrOpen}
            className={cn(
              "flex items-center gap-3 relative",
              isQrOpen ? "cursor-auto" : "cursor-pointer"
            )}
          >
            <div className="relative">
              <LineSquareCustomIcon size={32} />
              {/* Mobile-only dot (collapsed state only) */}
              {statusDot(
                isQrOpen
                  ? "hidden"
                  : "lg:hidden flex absolute -top-[3px] -right-[3px]"
              )}
            </div>
            <div
              className={cn(
                "flex-col -space-y-1 items-start",
                isQrOpen ? "flex" : "hidden lg:flex"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="sop-body-md-medium line-clamp-1 text-sop-neutral-gray-200">
                  ติดต่อแอดมิน
                </span>
                {statusDot()}
              </div>
              <span className="sop-body-md-light line-clamp-1 text-sop-neutral-gray-200">
                ผ่านช่องทาง LINE OA
              </span>
            </div>
          </button>
        </div>

        {/* QR panel — always mounted, animated via grid-rows */}
        <div
          aria-hidden={!isQrOpen}
          className={cn(
            "grid",
            isQrOpen
              ? "grid-rows-[1fr] opacity-100 w-full mt-sop-12px"
              : "grid-rows-[0fr] opacity-0 w-0 mt-0"
          )}
          style={{ transition: heightTransition }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-sop-12px">
              <div
                className="flex items-center justify-center h-sop-224px w-full bg-sop-neutral-gray-600 rounded-sop-16px"
                role="img"
                aria-label="QR Code สำหรับเพิ่มเพื่อน LINE Official Account"
              >
                <QrAddLineOAIcon size={isMobile ? 125 : 160} />
              </div>
              <div className="flex bg-sop-neutral-grayalpha-100 rounded-sop-12px justify-between items-center px-sop-12px py-sop-8px">
                <div className="flex-col -space-y-1 items-start">
                  <span
                    className="sop-body-md-light line-clamp-1 text-sop-neutral-gray-200"
                    id="line-id-label"
                  >
                    LINE ID
                  </span>
                  <span
                    className="sop-body-md-regular line-clamp-1 text-sop-neutral-gray-200"
                    aria-labelledby="line-id-label"
                  >
                    {LINE_ID}
                  </span>
                </div>
                <a
                  href={LINE_OA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="เปิด LINE เพื่อเพิ่มเพื่อน Official Account"
                  className={cn(
                    "shadow-xs relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap border border-transparent transition-colors",
                    "min-w-19 h-sop-36px rounded-sop-32 py-sop-8px px-sop-16px sop-body-sm-medium",
                    "bg-sop-system-success-500 hover:bg-sop-system-success-400 text-sop-neutral-grayfixed-600"
                  )}
                >
                  แอดไลน์เลย
                </a>
              </div>
              <span
                className="sop-body-sm-light line-clamp-1 text-sop-neutral-gray-200 text-center w-full"
                role="note"
              >
                ปรึกษาปัญหาสัตว์เลี้ยงฟรี 24 ชม.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatWithAdminFloatingButton
