import { cn } from "@/lib/utils"
import { ProfileIcon } from "@/icons"
import SmartImage from "../SmartImage/SmartImage"

interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: "small" | "large" | "xsmall"
  className?: string
}

export function Avatar({
  src,
  alt,
  initials,
  size = "small",
  className,
}: AvatarProps) {
  const baseClasses =
    "aspect-square rounded-full bg-sop-neutral-gray-500 flex items-center justify-center"
  const sizeClasses = {
    xsmall: "w-sop-28px h-sop-28px text-sm",
    small: "w-sop-56px h-sop-56px text-sm",
    large: "w-[83px] h-[83px] font-semibold!",
  }

  const iconSize = {
    xsmall: 20,
    small: 24,
    large: 40,
  }

  if (src) {
    return (
      <SmartImage
        width={150}
        height={150}
        src={src}
        alt={alt || "Avatar"}
        className={cn(
          baseClasses,
          sizeClasses[size],
          "object-cover",
          className
        )}
      />
    )
  }

  return (
    <div className={cn(baseClasses, sizeClasses[size], className)}>
      {initials || <ProfileIcon size={iconSize[size]} />}
    </div>
  )
}
