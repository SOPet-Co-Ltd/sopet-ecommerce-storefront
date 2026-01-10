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
    <label className="flex items-center gap-2 cursor-pointer group">
      <span
        className={cn(
          "relative flex items-center justify-center w-[20px] h-[20px] rounded-[6px] border transition-all duration-200",
          // Default State (Unchecked)
          "bg-white border-sop-neutral-grayalpha-200", // Need to ensure colors exist or use hex fallback: border-[rgba(34,34,41,0.12)]

          // Checked State
          checked &&
            "bg-[color:var(--color-sop-primary-500)] border-[color:var(--color-sop-primary-500)]",

          // Error State
          error && "!border-red-500",

          // Indeterminate State
          indeterminate &&
            "bg-[color:var(--color-sop-primary-500)] border-[color:var(--color-sop-primary-500)]",

          // Disabled State
          props.disabled &&
            "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50",

          // Tailwind class overrides
          className
        )}
        style={{
          borderColor: !checked && !error ? "rgba(34,34,41,0.12)" : undefined,
        }}
      >
        {indeterminate && !checked && !props.disabled && (
          <MinusHeavyIcon size={14} className="text-white" />
        )}

        {checked && !props.disabled && (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}

        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0",
            props.disabled && "cursor-default"
          )}
          checked={checked}
          ref={(input) => {
            if (input) {
              input.indeterminate = !!indeterminate
            }
          }}
          {...props}
        />
      </span>
      {label && <span className="text-body-md text-gray-900">{label}</span>}
    </label>
  )
}
