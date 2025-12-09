"use client"
import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { EyeMini, EyeSlashMini } from "@medusajs/icons"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Variant props from Figma
  size?: "md" | "sm"
  state?: "default" | "hovered" | "filled" | "selected" | "disabled" | "error" | "Filled + Multiselect"
  variant?: "flat" | "bordered" | "underlined"
  
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
  hasTitle = true,
  title = "Title",
  isRequired = false,
  hasStartIcon = false,
  startIcon,
  hasEndIcon = false,
  endIcon,
  hasContent = true,
  contentText = "content",
  hasPlaceholder = false,
  placeholderText = "placeholder",
  withDescription = false,
  descriptionText = "กรุณากรอกข้อมูลของคุณ",
  className,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState(props.type)
  
  // Determine actual values
  const displayTitle = title
  const displayStartIcon = startIcon
  const displayEndIcon = endIcon
  const displayPlaceholder = props.placeholder || (hasPlaceholder ? placeholderText : undefined)
  const displayValue = props.value !== undefined ? props.value : (hasContent ? contentText : "")
  const isError = state === "error"
  const isDisabled = props.disabled || state === "disabled"
  
  // Size variants
  const sizeClasses = {
    sm: "text-xs h-8",
    md: "text-sm h-10",
  }
  
  // Variant styles
  const variantClasses = {
    flat: "bg-sop-neutral-gray-500 border border-solid border-sop-neutral-gray-500",
    bordered: "bg-transparent border border-solid border-sop-neutral-gray-400",
    underlined: "bg-transparent border-b border-solid border-sop-neutral-gray-400 rounded-none",
  }
  
  // State styles
  const stateClasses = {
    default: "",
    hovered: "border-sop-neutral-grayalpha-300",
    filled: "border-sop-neutral-grayalpha-300",
    selected: "border-sop-primary-500 ring-1 ring-sop-primary-500",
    disabled: "bg-sop-neutral-grayalpha-200 cursor-not-allowed text-sop-neutral-gray-400 border-sop-neutral-grayalpha-300",
    error: "border-sop-system-error-400 ring-1 ring-sop-system-error-400",
    "Filled + Multiselect": "border-sop-neutral-grayalpha-300",
  }
  
  let paddingLeft = "pl-3"
  let paddingRight = "pr-3"
  
  if (hasStartIcon && displayStartIcon) paddingLeft = "pl-10"
  if ((hasEndIcon && displayEndIcon) || props.type === "password") paddingRight = "pr-10"

  useEffect(() => {
    if (props.type === "password" && showPassword) {
      setInputType("text")
    }

    if (props.type === "password" && !showPassword) {
      setInputType("password")
    }
  }, [props.type, showPassword])

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.onChange) {
      props.onChange(e)
    }
  }

  return (
    <div className="w-full">
      {hasTitle && displayTitle && (
        <label className="label-md flex items-center gap-1 mb-2">
          {displayTitle}
          {isRequired && <span className="text-sop-system-error-400">*</span>}
        </label>
      )}
      
      <div className="relative w-full">
        {(hasStartIcon && displayStartIcon) && (
          <span className="absolute top-0 left-3 h-full flex items-center text-sop-neutral-gray-400">
            {displayStartIcon}
          </span>
        )}

        <input
          className={cn(
            "w-full p-2 sop-body-sm-regular rounded-[8px]",
            "text-sop-neutral-gray-400",
            "focus:border-sop-primary-500 focus:outline-none focus:ring-1 focus:ring-sop-primary-500",
            "placeholder:text-sop-neutral-gray-400",
            "transition-all duration-150",
            sizeClasses[size],
            variantClasses[variant],
            stateClasses[state],
            isError && !isDisabled && "border-sop-system-error-400 ring-1 ring-sop-system-error-400",
            isDisabled && "bg-sop-neutral-grayalpha-200 cursor-not-allowed text-sop-neutral-gray-400 border-sop-neutral-grayalpha-300",
            paddingLeft,
            paddingRight,
            className
          )}
          value={displayValue}
          placeholder={displayPlaceholder}
          onChange={changeHandler}
          disabled={isDisabled}
          {...props}
          type={props.type === "password" ? inputType : props.type}
        />
        
        {(hasEndIcon && displayEndIcon && props.type !== "password") && (
          <span className="absolute top-0 right-3 h-full flex items-center text-sop-neutral-gray-400">
            {displayEndIcon}
          </span>
        )}
        
        {props.type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sop-neutral-gray-400 hover:text-sop-neutral-gray-300 focus:outline-hidden transition-all duration-150"
          >
            {showPassword ? <EyeMini /> : <EyeSlashMini />}
          </button>
        )}
      </div>
      
      {withDescription && descriptionText && (
        <p className={cn(
          "text-xs mt-1",
          isError ? "text-sop-system-error-400" : "text-sop-neutral-gray-400"
        )}>
          {descriptionText}
        </p>
      )}
    </div>
  )
}
