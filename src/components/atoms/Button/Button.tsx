import { cn } from "@/lib/utils"

import Spinner from "@/icons/spinner"

type SopButtonVariant =
  | "primary"
  | "outline"
  | "filled"
  | "destructive"
  | "neutral"
  | "ghost"
  | "link"

type ButtonUiType = "button" | "icon"
type ButtonRounded = "full" | "rounded"

type ButtonSize = "sm" | "md" | "lg" | "xl"
type IconButtonSize = "sm" | "md"

// Backward compatible values used across the codebase today.
type LegacyButtonVariant = "default" | "secondary" | "icon" | "grey"
type LegacyButtonSize = "default" | "fill" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * SOP variant.
   *
   * Backward compatible mappings:
   * - "default" -> "primary"
   * - "secondary" -> "outline"
   * - "grey" -> "filled"
   * - "icon" -> uiType="icon" + variant defaults to "ghost"
   */
  variant?: SopButtonVariant | LegacyButtonVariant
  /**
   * Visual type (separate from HTML button type).
   */
  uiType?: ButtonUiType
  /**
   * Size depends on uiType:
   * - uiType="button": sm | md | lg
   * - uiType="icon": sm | md
   *
   * Backward compatible:
   * - "fill" -> fill={true}
   * - "icon" -> uiType="icon"
   * - "default" -> md (or md icon)
   */
  size?: ButtonSize | IconButtonSize | LegacyButtonSize
  rounded?: ButtonRounded
  fill?: boolean
  loading?: boolean
}

export function Button({
  children,
  variant,
  uiType,
  size,
  rounded = "full",
  fill,
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const isIconUiType =
    uiType === "icon" || variant === "icon" || size === "icon"

  const resolvedUiType: ButtonUiType = isIconUiType ? "icon" : "button"
  const resolvedFill =
    resolvedUiType === "button" ? (fill ?? size === "fill") : false

  const variantClasses: Record<SopButtonVariant, string> = {
    primary:
      "bg-sop-primary-500 text-sop-neutral-grayfixed-600 border-transparent hover:bg-sop-primary-600",
    outline:
      "bg-transparent text-sop-secondary-500 border-sop-secondary-500 hover:bg-sop-secondary-100",
    filled:
      "bg-sop-neutral-gray-500 text-sop-neutral-gray-200 border-transparent",
    destructive:
      "bg-sop-system-error-400 text-sop-neutral-grayfixed-600 border-transparent hover:bg-sop-system-error-500",
    neutral:
      "bg-transparent text-sop-neutral-gray-200 border border-sop-neutral-grayalpha-100 hover:bg-sop-neutral-grayalpha-100",
    ghost:
      "bg-transparent text-sop-neutral-gray-100 border-transparent hover:bg-sop-neutral-grayalpha-100",
    link: "bg-transparent text-sop-secondary-500 border-transparent underline underline-offset-4",
  }

  const sizeButtonClasses: Record<ButtonSize, string> = {
    sm: "min-w-[68px] h-[32px] py-sop-8px px-sop-12px sop-body-sm-medium",
    md: "min-w-[76px] h-[36px] py-sop-8px px-sop-16px sop-body-sm-medium",
    lg: "min-w-[76px] h-[44px] py-sop-4px px-sop-16px sop-body-sm-medium",
    xl: "min-w-[114px] h-[48px] py-sop-4px px-sop-32px sop-body-md-medium",
  }

  const sizeIconClasses: Record<IconButtonSize, string> = {
    sm: "min-h-[32px] min-w-[32px] aspect-square p-sop-8px [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
    md: "min-h-[36px] min-w-[36px] aspect-square p-sop-8px [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
  }

  const resolvedVariant: SopButtonVariant = (() => {
    if (typeof variant === "string" && variant in variantClasses) {
      return variant as SopButtonVariant
    }

    switch (variant) {
      case "default":
        return "primary"
      case "secondary":
        return "outline"
      case "grey":
        return "filled"
      case "icon":
        return "ghost"
      default:
        return resolvedUiType === "icon" ? "ghost" : "primary"
    }
  })()

  const resolvedSize: ButtonSize | IconButtonSize = (() => {
    if (resolvedUiType === "icon") {
      if (size === "sm" || size === "md") return size
      return "md"
    }

    if (size === "sm" || size === "md" || size === "lg") return size
    return "md"
  })()

  const resolvedRoundedClass = (() => {
    if (rounded === "rounded") return "rounded-sop-8"

    if (resolvedUiType === "icon") return "rounded-sop-36"
    return resolvedSize === "lg" ? "rounded-sop-36" : "rounded-sop-32"
  })()

  const baseClasses =
    "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-40"

  const resolvedSizeClass =
    resolvedUiType === "icon"
      ? sizeIconClasses[resolvedSize as IconButtonSize]
      : sizeButtonClasses[resolvedSize as ButtonSize]

  const spinnerSize = resolvedUiType === "icon" ? 12 : 16
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "shadow-xs",
        baseClasses,
        variantClasses[resolvedVariant],
        resolvedSizeClass,
        resolvedRoundedClass,
        resolvedFill && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={spinnerSize} />
        </span>
      )}
      <span className={cn(loading && "opacity-0", "w-full")}>{children}</span>
    </button>
  )
}
