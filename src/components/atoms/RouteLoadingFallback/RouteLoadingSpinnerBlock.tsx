"use client"

export type RouteLoadingVariant = "main" | "compact"

export function RouteLoadingSpinnerBlock({
  variant = "main",
}: {
  variant?: RouteLoadingVariant
}) {
  const compact = variant === "compact"

  return (
    <div className="flex flex-col items-center">
      <span className="sr-only">
        {variant === "main" ? "กำลังโหลดหน้า" : "กำลังโหลดส่วนของรายการ"}
      </span>
      <div
        className={`flex items-center justify-center ${compact ? "h-24 w-48" : "h-32.75 w-65.5"}`}
        aria-hidden
      >
        <div
          className={`rounded-full border-4 border-sop-secondary-200 border-t-sop-secondary-500 motion-safe:animate-spin ${
            compact ? "h-10 w-10" : "h-14 w-14"
          }`}
        />
      </div>
      <label className="sop-body-lg-medium text-sop-secondary-500 text-center">
        กำลังโหลด ...
      </label>{" "}
    </div>
  )
}
