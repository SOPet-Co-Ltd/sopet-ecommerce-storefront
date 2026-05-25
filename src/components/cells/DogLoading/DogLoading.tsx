"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export default function DogLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sop-neutral-whitealpha-400 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <DotLottieReact
          className="w-65.5 h-32.75"
          src="/runningDog.lottie"
          loop
          autoplay
        />

        <label className="sop-body-lg-medium text-sop-secondary-500 text-center">
          กำลังโหลด ...
        </label>
      </div>
    </div>
  )
}
