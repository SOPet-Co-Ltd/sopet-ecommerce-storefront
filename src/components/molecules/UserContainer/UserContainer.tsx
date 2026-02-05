"use client"

import { cn } from "@/lib/utils"
import { LessThanIcon } from "@/icons"
import { useRouter } from "next/navigation"

type UserContainerProps = {
  title?: string
  children?: React.ReactNode
  /** When true, shows the back button in the header. Omit or true when title is set; set false to hide on specific pages. */
  showBackButton?: boolean
}

const BACK_LABEL = "ย้อนกลับ"
const ICON_SIZE = 14
const ICON_COLOR = "#211F23"

const UserContainer = ({
  title,
  children,
  showBackButton = false,
}: UserContainerProps) => {
  const router = useRouter()

  return (
    <div className="lg:bg-sop-base-white lg:rounded-sop-8px lg:p-sop-40px">
      {(title || showBackButton) && (
        <header
          className={cn(
            "border-b border-sop-neutral-grayalpha-300 mb-sop-20px flex justify-between items-center h-[42px]",
            // Mobile: show only when showBackButton; desktop: show when title or showBackButton
            !showBackButton && "hidden md:flex"
          )}
        >
          {title && <h2 className="sop-headline-sm-medium">{title}</h2>}
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 cursor-pointer"
              aria-label={BACK_LABEL}
            >
              <span className="flex items-center justify-center aspect-square h-sop-24px w-sop-24px">
                <LessThanIcon size={ICON_SIZE} color={ICON_COLOR} />
              </span>
              <span className="sop-link-md-regular text-sop-neutral-gray-300 underline">
                {BACK_LABEL}
              </span>
            </button>
          )}
        </header>
      )}
      <div>{children}</div>
    </div>
  )
}

export { UserContainer }
