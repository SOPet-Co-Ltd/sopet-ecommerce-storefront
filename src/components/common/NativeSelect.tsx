import { clx } from "@medusajs/ui"
import React, { forwardRef, useImperativeHandle, useRef } from "react"

type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  label?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      placeholder = "Select...",
      errors,
      touched,
      className,
      children,
      label,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle(ref, () => innerRef.current!)

    return (
      <div className="flex flex-col w-full">
        {label && (
          <span className="text-small-regular text-ui-fg-base mb-1">
            {label}
          </span>
        )}
        <div
          className={clx(
            "relative flex items-center bg-ui-bg-field hover:bg-ui-bg-field-hover border border-ui-border-base rounded-md focus-within:shadow-borders-interactive-with-active transition-all duration-300",
            className,
            {
              "border-ui-border-error": errors && touched,
              "opacity-50 pointer-events-none bg-gray-50": props.disabled,
            }
          )}
        >
          <select
            ref={innerRef}
            {...props}
            className="appearance-none w-full bg-transparent border-none px-4 py-2.5 text-small-regular text-ui-fg-base focus:ring-0 outline-hidden cursor-pointer relative z-10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {children}
          </select>
          <div className="absolute right-4 pointer-events-none text-ui-fg-subtle">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"
