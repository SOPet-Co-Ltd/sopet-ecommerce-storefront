import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

export type DropdownWidthMode = "trigger" | "fixed" | "content" | "viewport"

/** Horizontal snap of the panel relative to the trigger */
export type DropdownAlign = "start" | "end" | "center"

const PANEL_BASE =
  "absolute z-50 mt-1 overflow-hidden rounded-xl border border-sop-neutral-grayalpha-200 bg-sop-base-white shadow-lg"

const ALIGN_SNAP: Record<DropdownAlign, string> = {
  /** Left edge of panel aligns with left edge of trigger (default) */
  start: "left-0 right-auto",
  /** Right edge of panel aligns with right edge of trigger */
  end: "right-0 left-auto",
  center: "left-1/2 right-auto -translate-x-1/2",
}

const WIDTH_BY_MODE: Record<DropdownWidthMode, string> = {
  /** Same width as the trigger wrapper / input */
  trigger: "box-border w-full min-w-0 max-w-full",
  fixed: "min-w-0",
  content: "min-w-full w-max max-w-[min(100%,calc(100vw-2rem))]",
  viewport:
    "box-border w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg",
}

/** Viewport breakout positioning per align (mobile uses viewport inset) */
const VIEWPORT_ALIGN: Record<DropdownAlign, string> = {
  start: "left-0 ml-[calc(50%-50vw+1rem)] sm:ml-0 sm:translate-x-0",
  end: "right-0 left-auto mr-[calc(50%-50vw+1rem)] sm:mr-0 sm:translate-x-0",
  center: "left-1/2 -translate-x-1/2 ml-[calc(50%-50vw+1rem)] sm:ml-0",
}

export function getFixedDropdownWidthStyle(
  mode: DropdownWidthMode,
  fixedDropdownWidth?: number | string
): CSSProperties | undefined {
  if (mode !== "fixed" || fixedDropdownWidth === undefined) {
    return undefined
  }

  const width =
    typeof fixedDropdownWidth === "number"
      ? `${fixedDropdownWidth}px`
      : fixedDropdownWidth

  return { width }
}

export function getDropdownPanelClassName(
  mode: DropdownWidthMode = "trigger",
  align: DropdownAlign = "start",
  dropdownClassName?: string
): string {
  const alignClasses =
    mode === "viewport" ? VIEWPORT_ALIGN[align] : ALIGN_SNAP[align]

  return cn(PANEL_BASE, alignClasses, WIDTH_BY_MODE[mode], dropdownClassName)
}

export function getDropdownPanelStyle(
  mode: DropdownWidthMode,
  options?: {
    fixedDropdownWidth?: number | string
    triggerWidthPx?: number
  }
): CSSProperties | undefined {
  if (mode === "fixed") {
    return getFixedDropdownWidthStyle(mode, options?.fixedDropdownWidth)
  }

  if (mode === "trigger" && options?.triggerWidthPx) {
    return { width: options.triggerWidthPx }
  }

  return undefined
}
