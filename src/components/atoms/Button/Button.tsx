import { cn } from "@/lib/utils"

import Spinner from "@/icons/spinner"

type ButtonVariant = "default" | "secondary" | "icon" | "grey"
type ButtonSize = "default" | "fill" | "icon"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  children,
  variant = "default",
  size = "default",
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const baseClasses =
    "md:sop-body-md-medium sop-body-sm-medium rounded-full transition-colors border flex items-center justify-center gap-2 disabled:cursor-not-allowed"

  const variantClasses: Record<ButtonVariant, string> = {
    default:
      "bg-sop-primary-500 border-sop-primary-500 text-sop-neutral-grayfixed-600 hover:bg-sop-primary-600 hover:border-sop-primary-600 disabled:bg-sop-primary-500/50 disabled:border-sop-primary-500/50 disabled:text-sop-neutral-grayfixed-600/50",
    secondary:
      "bg-sop-secondary-100 border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-secondary-200 disabled:bg-sop-secondary-100/50 disabled:border-sop-secondary-500/50 disabled:text-sop-secondary-500/50",
    icon: "bg-transparent border-transparent cursor-pointer",
    grey: "bg-sop-neutral-grey-100 border-sop-neutral-grayalpha-200 text-sop-neutral-gray-200 hover:bg-sop-neutral-grey-200 disabled:bg-sop-neutral-grey-100/50 disabled:border-sop-neutral-grayalpha-200/50 disabled:text-sop-neutral-gray-200/50",
  }

  const sizeClasses: Record<ButtonSize, string> = {
    default: "md:py-sop-4px md:px-sop-8px py-sop-2px px-sop-4px",
    fill: "w-full",
    icon: "h-fit w-fit aspect-square p-sop-8px",
  }

  return (
    <button
      disabled={disabled}
      className={cn(
        className,
        variantClasses[variant],
        sizeClasses[size],
        baseClasses
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
