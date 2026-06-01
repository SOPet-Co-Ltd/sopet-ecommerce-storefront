"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export type RouteLoadingVariant = "main" | "compact"

export function RouteLoadingSpinnerBlock({
  variant = "main",
}: {
  variant?: RouteLoadingVariant
}) {
  const compact = variant === "compact"
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME

  return (
    <div className="flex flex-col items-center">
      <span className="sr-only">
        {variant === "main" ? "กำลังโหลดหน้า" : "กำลังโหลดส่วนของรายการ"}
      </span>
      <DotLottieReact
        className={compact ? "w-48 h-24" : "w-65.5 h-32.75"}
        src="/runningDog.lottie"
        loop
        autoplay
      />
      <label className="sop-body-lg-medium text-sop-secondary-500 text-center">
        กำลังโหลด ...
      </label>{" "}
    </div>
  )
}
