"use client"
import { cn } from "@/lib/utils"
// Using standard SVGs or Lucide icons if custom icons aren't perfectly matching,
// but sticking to existing imports if they work intended.
// Assuming MinusHeavyIcon/TickThinIcon are correct internal icons, changing styles primarily.
import { MinusHeavyIcon, TickThinIcon } from "@/icons"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean
  error?: boolean
  label?: string
}

export function Checkbox({
  label,
  indeterminate,
  error,
  className,
  checked,
  onChange,
  ...props
}: CheckboxProps) {
  // Provide a no-op onChange if none is provided to prevent React warning
  const handleChange = onChange || (() => {})

  return (
    <label>
      <span
        className={cn(
          "relative flex items-center justify-center w-4 h-4 border-2 rounded transition-colors",
          "border-sop-primary-500",
          checked && "bg-sop-primary-500 border-sop-primary-500",
          !checked && "bg-transparent",
          error && "border-sop-negative-500",
          props.disabled && "bg-sop-disabled border-sop-disabled cursor-not-allowed opacity-50",
          className
        )}
        style={{
          borderColor: !checked && !error ? "rgba(34,34,41,0.12)" : undefined,
        }}
      >
        {indeterminate && !checked && !props.disabled && (
          <MinusHeavyIcon size={12} color="#FFFFFF" />
        )}
        {checked && !props.disabled && <TickThinIcon size={12} color="#FFFFFF" />}

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
