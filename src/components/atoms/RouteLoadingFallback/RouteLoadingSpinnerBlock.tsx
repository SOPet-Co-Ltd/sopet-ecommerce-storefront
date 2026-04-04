export type RouteLoadingVariant = "main" | "compact"

export function RouteLoadingSpinnerBlock({
  variant = "main",
}: {
  variant?: RouteLoadingVariant
}) {
  const compact = variant === "compact"
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME

  return (
    <>
      <span className="sr-only">
        {variant === "main" ? "กำลังโหลดหน้า" : "กำลังโหลดส่วนของรายการ"}
      </span>

      <div
        className={`shrink-0 rounded-full border-2 border-sop-primary-200 border-t-sop-secondary-400 animate-spin motion-reduce:animate-none ${compact ? "size-9" : "size-12"}`}
        aria-hidden
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-body-md font-medium text-sop-neutral-gray-300">
          {variant === "main" ? "Loading..." : "Loading..."}
        </p>
        {siteName ? (
          <p className="text-sm text-sop-neutral-gray-400 max-w-xs truncate">
            {siteName}
          </p>
        ) : null}
      </div>
    </>
  )
}
