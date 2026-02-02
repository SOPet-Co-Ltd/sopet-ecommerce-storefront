"use client"
import { cn } from "@/lib/utils"
// Using standard SVGs or Lucide icons if custom icons aren't perfectly matching,
// but sticking to existing imports if they work intended.
// Assuming MinusHeavyIcon/TickThinIcon are correct internal icons, changing styles primarily.
import { MinusHeavyIcon, TickThinIcon } from "@/icons"

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "checked"
> {
  checked?: boolean | "indeterminate"
  size?: "sm" | "lg"
  error?: boolean
  label?: React.ReactNode | false
  checkboxPosition?: "top" | "middle" | "bottom"
  disable?: boolean
}

export function Checkbox({
  label = false,
  size = "sm",
  error,
  checkboxPosition = "middle",
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
  const handleChange = onChange ?? (isControlled ? () => {} : undefined)

  const iconSize = size === "lg" ? 12 : 10
  const boxSizeClasses = size === "lg" ? "w-5 h-5" : "w-4 h-4"
  const labelAlignClass =
    checkboxPosition === "top"
      ? "items-start"
      : checkboxPosition === "bottom"
        ? "items-end"
        : "items-center"
  const boxAlignClasses = hasLabel
    ? checkboxPosition === "top"
      ? size === "sm"
        ? "mt-[2px]"
        : "mt-0"
      : checkboxPosition === "bottom"
        ? size === "sm"
          ? "mb-[2px]"
          : "mb-0"
        : ""
    : ""

  const inputChecked = isIndeterminate
    ? false
    : typeof checked === "boolean"
      ? checked
      : undefined

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
    <label>
      <span
        className={cn(
          "relative flex items-center justify-center w-4 h-4 border-2 rounded transition-colors",
          "border-sop-primary-500",
          checked && "bg-sop-primary-500 border-sop-primary-500",
          !checked && "bg-transparent",
          error && "border-sop-negative-500",
          props.disabled &&
            "bg-sop-disabled border-sop-disabled cursor-not-allowed opacity-50",
          className
        )}
        style={{
          borderColor: !checked && !error ? "rgba(34,34,41,0.12)" : undefined,
        }}
      >
        {isIndeterminate && !checked && !props.disabled && (
          <MinusHeavyIcon size={12} color="#FFFFFF" />
        )}
        {isChecked && !props.disabled && (
          <TickThinIcon size={12} color="#FFFFFF" />
        )}

        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
            props.disabled && "cursor-not-allowed"
          )}
          ref={(input) => {
            if (input) {
              input.indeterminate = !!indeterminate
            }
          }}
          {...props}
        />
      </span>
      {label && (
        <span className="sop-body-sm-regular text-sop-neutral-gray-200">
          {label}
        </span>
      )}
    </label>
  )
}
