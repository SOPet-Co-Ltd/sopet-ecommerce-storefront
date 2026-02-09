"use client"
import { cn } from "@/lib/utils"

import { useMemo, useState, useCallback, useId } from "react"
import { EyeMini, EyeSlashMini } from "@medusajs/icons"

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  // Variant props from Figma
  size?: "md" | "sm"
  state?: "default" | "hovered" | "filled" | "selected" | "disabled" | "error"
  variant?: "flat" | "bordered" | "underlined"
  textSize?: "sm" | "xs"

  // Title props
  hasTitle?: boolean
  title?: string
  isRequired?: boolean

  // Icon props
  hasStartIcon?: boolean
  startIcon?: React.ReactNode
  hasEndIcon?: boolean
  endIcon?: React.ReactNode

  // Content props
  hasContent?: boolean
  contentText?: string
  hasPlaceholder?: boolean
  placeholderText?: string

  // Description props
  withDescription?: boolean
  descriptionText?: string
}

export function Input({
  size = "md",
  state = "default",
  variant = "flat",
  textSize = "sm",
  hasTitle = true,
  title = "Title",
  isRequired = false,
  hasStartIcon = false,
  startIcon,
  hasEndIcon = false,
  endIcon,
  withDescription = false,
  descriptionText = "กรุณากรอกข้อมูลของคุณ",
  className,
  id,
  type = "text",
  disabled,
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
  const showStartIcon = hasStartIcon && startIcon
  const showEndIcon = hasEndIcon && endIcon && !isPassword

  // Compute padding classes
  const paddingClasses = useMemo(() => {
    const left = showStartIcon ? "pl-10" : "pl-3"
    const right = showEndIcon || isPassword ? "pr-10" : "pr-3"
    return { left, right }
  }, [showStartIcon, showEndIcon, isPassword])

  // Size variants
  const sizeClasses = {
    sm: "text-xs h-8",
    md: "text-sm h-10",
  } as const

  // Text size variants
  const textSizeClasses = {
    sm: "sop-body-sm-regular",
    xs: "sop-body-xs-regular",
  } as const

  // Variant styles
  const variantClasses = {
    flat: "bg-sop-neutral-gray-500 border border-solid border-sop-neutral-gray-500",
    bordered: "bg-transparent border border-solid border-sop-neutral-gray-400",
    underlined:
      "bg-transparent border-b border-solid border-sop-neutral-gray-400 rounded-none",
  } as const

  // State styles
  const stateClasses = {
    default: "",
    hovered: "border-sop-neutral-grayalpha-300",
    filled: "border-sop-neutral-grayalpha-300",
    selected: "border-sop-primary-500 ring-1 ring-sop-primary-500",
    disabled:
      "bg-sop-neutral-grayalpha-200 cursor-not-allowed text-sop-neutral-gray-400 border-sop-neutral-grayalpha-300",
    error: "border-sop-system-error-400 ring-1 ring-sop-system-error-400",
  } as const

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  // Build input className
  const inputClassName = useMemo(
    () =>
      cn(
        "w-full p-2 rounded-[8px]",
        textSizeClasses[textSize],
        "text-sop-neutral-gray-400",
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
        paddingClasses.left,
        paddingClasses.right,
        className
      ),
    [
      textSize,
      size,
      variant,
      state,
      isError,
      isDisabled,
      paddingClasses.left,
      paddingClasses.right,
      className,
    ]
  )

  return (
    <div className="w-full">
      {hasTitle && title && (
        <label
          htmlFor={finalId}
          className="label-md flex items-center gap-1 mb-2"
        >
          {title}
          {isRequired && <span className="text-sop-system-error-400">*</span>}
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

      {withDescription && descriptionText && (
        <p
          id={`${finalId}-description`}
          className={cn(
            "text-xs mt-1",
            isError ? "text-sop-system-error-400" : "text-sop-neutral-gray-400"
          )}
        >
          {descriptionText}
        </p>
      )}
    </div>
  )
}
