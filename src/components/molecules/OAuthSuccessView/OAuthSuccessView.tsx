"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FacebookCustomIcon, GoogleIcon, LineCustomIcon } from "@/icons"

const REDIRECT_DELAY_MS = 1500

export type OAuthSuccessProvider = "google" | "facebook" | "line"

type OAuthSuccessViewProps = {
  locale: string
  provider: OAuthSuccessProvider | null
}

const PROVIDER_CONFIG: Record<
  OAuthSuccessProvider,
  { label: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  google: {
    label: "Google",
    Icon: GoogleIcon,
  },
  facebook: {
    label: "Facebook",
    Icon: FacebookCustomIcon,
  },
  line: {
    label: "LINE",
    Icon: LineCustomIcon,
  },
}

export function OAuthSuccessView({ locale, provider }: OAuthSuccessViewProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(`/${locale}/user/profile`)
    }, REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [locale, router])

  const config = provider ? PROVIDER_CONFIG[provider] : null
  const Icon = config?.Icon

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] min-w-[300px] overflow-hidden rounded-2xl border border-sop-neutral-grayalpha-100 bg-sop-base-white shadow-[0_4px_24px_var(--color-sop-neutral-grayalpha-100)]">
        {/* SOPet gradient band */}
        <div className="sop-gradient-01 h-2 w-full" aria-hidden />

        <div className="flex flex-col items-center gap-6 px-8 py-8">
          {config && Icon ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sop-primary-100 ring-4 ring-sop-primary-200/50">
                <Icon size={32} />
              </div>
              <div className="space-y-1 text-center">
                <p className="sop-headline-md-semibold text-sop-neutral-gray-100">
                  Signed in with {config.label}
                </p>
                <p className="sop-body-sm-regular text-sop-system-success-500">
                  เข้าสู่ระบบสำเร็จ
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-1 text-center">
              <p className="sop-headline-md-semibold text-sop-neutral-gray-100">
                You are signed in
              </p>
              <p className="sop-body-sm-regular text-sop-system-success-500">
                เข้าสู่ระบบสำเร็จ
              </p>
            </div>
          )}

          <p className="sop-body-sm-regular text-center text-sop-neutral-gray-400">
            กำลังนำคุณไปยังบัญชี…
          </p>

          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-sop-primary-200 border-t-sop-primary-500"
            aria-hidden
          />
        </div>
      </div>
    </main>
  )
}
