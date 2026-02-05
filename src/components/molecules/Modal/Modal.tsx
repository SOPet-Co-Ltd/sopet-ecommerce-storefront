"use client"

import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

type ModalProps = {
  header?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  onClose?: () => void
  className?: string
  width?: number
}

export const Modal = ({
  header,
  children,
  footer,
  onClose,
  className,
  width = 600,
}: ModalProps) => {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
    },
    [onClose]
  )

  useEffect(() => {
    if (!onClose) return
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose, handleEscape])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex h-screen items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className={cn(
          "relative z-10 flex min-h-0 w-full max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[20px] bg-sop-base-white",
          `max-w-[${width}px]`,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 gap-sop-20px pt-sop-20px">
          {header != null && <div className="shrink-0">{header}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          {footer != null && <div className="shrink-0">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
