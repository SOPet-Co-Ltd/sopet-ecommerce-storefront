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

  transparentBackground?: boolean
  insideCloseButton?: boolean
}

export const Modal = ({
  header,
  children,
  footer,
  onClose,
  className,
  overlayClassName,
  width = 600,
  transparentBackground = false,
  insideCloseButton = false,
}: ModalProps) => {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
    },
    [onClose]
  )

  useEffect(() => {
    if (onClose) {
      document.addEventListener("keydown", handleEscape)
    }

    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [onClose, handleEscape])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-14">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm",
          transparentBackground
            ? "bg-transparent"
            : "bg-sop-neutral-whitealpha-400",
          overlayClassName
        )}
      />

      <div
        className={cn("relative w-full max-w-150", className)}
        style={{ maxWidth: width }}
      >
        {onClose && !insideCloseButton && (
          <button
            onClick={onClose}
            className="absolute -top-14 right-4 translate-x-1/2 z-9999 flex h-10 w-10 items-center justify-center rounded-full bg-sop-base-white shadow-lg text-sop-base-black cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        <div
          className={cn(
            `
            flex
            max-h-135.25
            flex-col
            overflow-hidden
            rounded-sop-20px
            bg-sop-base-white
            shadow-lg
            relative
            `,
            transparentBackground && "bg-transparent shadow-none"
          )}
        >
          {insideCloseButton && onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sop-base-white shadow-lg text-sop-base-black cursor-pointer"
            >
              <X size={16} />
            </button>
          )}

          {header != null && <div className="shrink-0 p-4">{header}</div>}

          <div className="flex-1 overflow-y-auto px-4">{children}</div>

          {footer != null && (
            <div className="shrink-0 bg-sop-base-white p-4">
              <div className="shrink-0">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
