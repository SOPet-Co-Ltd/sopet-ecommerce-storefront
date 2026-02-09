"use client"
import { cn } from "@/lib/utils"

import { useMemo, useState, useCallback, useId } from "react"
import { EyeMini, EyeSlashMini } from "@medusajs/icons"

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: "md" | "sm"
  state?: "default" | "hover" | "filled" | "disabled" | "error"
  variant?: "flat" | "bordered" | "underlined"

  // Title props
  title?: string
  isRequire?: boolean

  // Icon props
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode

  // Description props
  description?: string
}

export function Input({
  size = "md",
  state = "default",
  variant = "flat",
  title,
  isRequire = false,
  startIcon,
  endIcon,
  description,
  className,
  id,
  type = "text",
  disabled,
  placeholder,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = useId()
  const finalId = id || inputId

  // Compute derived values
  const isError = state === "error"
  const isDisabled = disabled || state === "disabled"
  const isPassword = type === "password"
  const actualType = isPassword ? (showPassword ? "text" : "password") : type

  // Check if icons should be displayed
  const showStartIcon = !!startIcon
  const showEndIcon = !!endIcon && !isPassword

  // Compute padding classes
  const paddingLeft = showStartIcon ? "pl-10" : "pl-3"
  const paddingRight = showEndIcon || isPassword ? "pr-10" : "pr-3"

  // Size variants
  const sizeClasses = {
    sm: "sop-body-sm-regular h-[44px]",
    md: "sop-body-sm-regular h-[48px]",
  } as const

  // Variant styles
  const variantClasses = {
    flat: "bg-sop-neutral-gray-500 border border-solid border-sop-neutral-gray-500",
    bordered:
      "bg-sop-neutral-gray-600 border border-solid border-sop-neutral-grayalpha-100",
    underlined:
      "bg-transparent border-b border-solid border-sop-neutral-grayalpha-100 rounded-none",
  } as const

  // State styles
  const stateClasses = {
    default: "",
    hover: "border-sop-neutral-grayalpha-300",
    filled: "border-sop-neutral-grayalpha-300",
    disabled:
      "bg-sop-neutral-grayalpha-200 cursor-not-allowed text-sop-neutral-gray-400 border-sop-neutral-grayalpha-300",
    error: "border-sop-system-error-400 ring-1 ring-sop-system-error-400",
  } as const

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  // Build input className
  const inputClassName = cn(
    "w-full p-2 rounded-[8px]",
    "sop-body-sm-regular",
    "text-sop-neutral-gray-200",
    "focus:border-sop-primary-500 focus:outline-none focus:ring-1 focus:ring-sop-primary-500",
    "placeholder:text-sop-neutral-gray-400",
    "transition-all duration-150",
    sizeClasses[size],
    variantClasses[variant],
    stateClasses[state],
    isError &&
      !isDisabled &&
      "border-sop-system-error-400 ring-1 ring-sop-system-error-400",
    isDisabled &&
      "bg-sop-neutral-grayalpha-200 cursor-not-allowed text-sop-neutral-gray-400 border-sop-neutral-grayalpha-300",
    paddingLeft,
    paddingRight,
    className
  )

  return (
    <div className="">
      {title !== undefined && (
        <label
          htmlFor={finalId}
          className="sop-body-xs-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2"
        >
          {title}
          {isRequire && <span className="text-sop-system-error-400">*</span>}
        </label>
      )}

      <div className="relative w-full">
        {showStartIcon && (
          <span className="absolute top-0 left-3 h-full flex items-center text-sop-neutral-gray-400 pointer-events-none">
            {startIcon}
          </span>
        )}

        <input
          {...props}
          id={finalId}
          type={actualType}
          className={inputClassName}
          disabled={isDisabled}
          placeholder={placeholder}
        />

        {showEndIcon && (
          <span className="absolute top-0 right-3 h-full flex items-center text-sop-neutral-gray-400 pointer-events-none">
            {endIcon}
          </span>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sop-neutral-gray-400 hover:text-sop-neutral-gray-300 focus:outline-none transition-all duration-150"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? <EyeMini /> : <EyeSlashMini />}
          </button>
        )}
      </div>

      {description !== undefined && (
        <p
          id={`${finalId}-description`}
          className="sop-body-xs-regular text-sop-system-error-400 mt-1"
        >
          {description}
        </p>
      )}
    </div>
  )
}
