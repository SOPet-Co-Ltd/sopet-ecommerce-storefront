"use client"

import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type ModalProps = {
  header?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  onClose?: () => void
  overlayClassName?: string
  className?: string
  width?: number
}

export const Modal = ({
  header,
  children,
  footer,
  onClose,
  className,
  overlayClassName,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-14">
      <div className="absolute inset-0 bg-sop-neutral-whitealpha-400 backdrop-blur-sm" />
      <div className="relative w-full max-w-150">
        {onClose && (
          <button
            onClick={onClose}
            className=" absolute -top-12 right-3 translate-x-1/2 z-9999 flex h-10 w-10 items-center justify-center rounded-full bg-sop-neutral-gray-500 shadow-lg text-sop-base-black cursor-pointer "
            aria-label="Close modal"
          >
            {" "}
            <X size={18} />{" "}
          </button>
        )}

        <div
          className="
        flex
        max-h-135.25
        flex-col
        overflow-hidden
        rounded-sop-20px
        bg-sop-base-white
        shadow-lg
      "
        >
          {header != null && <div className="shrink-0 p-4">{header}</div>}
          <div className="flex-1 overflow-y-auto px-4">{children}</div>
          {footer != null && (
            <div className="shrink-0 p-4 bg-sop-base-white">
              {footer != null && <div className="shrink-0">{footer}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
