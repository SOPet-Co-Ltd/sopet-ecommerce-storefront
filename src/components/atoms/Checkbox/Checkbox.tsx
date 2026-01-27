"use client"
import { cn } from "@/lib/utils"
import { MinusHeavyIcon, TickThinIcon } from "@/icons"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "checked"> {
  checked?: boolean | "indeterminate"
  size?: "sm" | "lg"
  error?: boolean
  label?: React.ReactNode | false
  disable?: boolean
}

export function Checkbox({
  label = false,
  size = "sm",
  error,
  className,
  checked,
  onChange,
  disabled,
  disable,
  ...props
}: CheckboxProps) {
  const hasLabel = label !== false && label !== null && label !== undefined
  const isDisabled = disabled ?? disable ?? false
  const isIndeterminate = checked === "indeterminate"
  const isChecked = checked === true
  const isOn = isChecked || isIndeterminate

  const isControlled = checked !== undefined
  // Provide a no-op onChange if controlled but none is provided to prevent React warning
  const handleChange = onChange ?? (isControlled ? (() => {}) : undefined)

  const iconSize = size === "lg" ? 12 : 10
  const boxSizeClasses = size === "lg" ? "w-5 h-5" : "w-4 h-4"
  const boxAlignClasses = hasLabel ? (size === "sm" ? "mt-[2px]" : "mt-0") : ""

  const inputChecked =
    isIndeterminate ? false : typeof checked === "boolean" ? checked : undefined

  const checkboxNode = (
    <span
      className={cn(
        "relative flex items-center justify-center border-2 rounded transition-colors shrink-0",
        boxSizeClasses,
        boxAlignClasses,
        "border-sop-primary-500",
        isOn && "bg-sop-primary-500 border-sop-primary-500",
        !isOn && "bg-transparent",
        error && "border-sop-system-error-400",
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        borderColor: !isOn && !error ? "rgba(34,34,41,0.12)" : undefined,
      }}
    >
      {isIndeterminate && <MinusHeavyIcon size={iconSize} color="#FFFFFF" />}
      {isChecked && <TickThinIcon size={iconSize} color="#FFFFFF" />}

      <input
        type="checkbox"
        checked={inputChecked}
        onChange={handleChange}
        disabled={isDisabled}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0",
          isDisabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
        ref={(input) => {
          if (input) {
            input.indeterminate = isIndeterminate
          }
        }}
        {...props}
      />
    </span>
  )

  if (!hasLabel) return checkboxNode

  return (
    <label
      className={cn(
        "inline-flex items-start gap-2",
        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {checkboxNode}
      <span className="sop-body-sm-regular text-sop-neutral-gray-200">
        {label}
      </span>
    </label>
  )
}
