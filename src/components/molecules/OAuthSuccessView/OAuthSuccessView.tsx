"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FacebookCustomIcon, GoogleIcon, LineCustomIcon } from "@/icons"
import { reactivateAccount } from "@/lib/data/customer"
import { finishCustomerLoginAfterAuth } from "@/lib/data/local-customer-cart"
import { ReactivateAccountModal } from "@/components/molecules/ReactivateAccountModal/ReactivateAccountModal"

const REDIRECT_DELAY_MS = 1500
const MERGE_DELAY_MS = 400

export type OAuthSuccessProvider = "google" | "facebook" | "line"

type OAuthSuccessViewProps = {
  locale: string
  provider: OAuthSuccessProvider | null
  reactivationToken?: string | null
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

export function OAuthSuccessView({
  locale,
  provider,
  reactivationToken = null,
}: OAuthSuccessViewProps) {
  const router = useRouter()
  const [isReactivating, setIsReactivating] = useState(false)
  const [reactivationError, setReactivationError] = useState<string | null>(
    null
  )
  const pendingDeletion = Boolean(reactivationToken)

  useEffect(() => {
    if (pendingDeletion) return

    let cancelled = false

    const mergeAndRedirect = async () => {
      try {
        await new Promise((r) => setTimeout(r, MERGE_DELAY_MS))
        if (cancelled) return
        await finishCustomerLoginAfterAuth()
      } catch (error) {
        console.error(
          "[OAuthSuccessView] Failed to merge anonymous cart:",
          error
        )
      } finally {
        if (!cancelled) {
          setTimeout(() => {
            router.replace(`/${locale}/user/profile`)
          }, REDIRECT_DELAY_MS)
        }
      }
    }

    void mergeAndRedirect()

    return () => {
      cancelled = true
    }
  }, [locale, pendingDeletion, router])

  const handleReactivateConfirm = async () => {
    if (!reactivationToken || isReactivating) return

    setReactivationError(null)
    setIsReactivating(true)

    const result = await reactivateAccount(reactivationToken)
    if (result.type === "error") {
      setReactivationError(result.message)
      setIsReactivating(false)
      return
    }

    try {
      await finishCustomerLoginAfterAuth()
    } catch (error) {
      console.error(
        "[OAuthSuccessView] Failed to complete login after reactivation:",
        error
      )
    }

    router.replace(`/${locale}/user/profile`)
  }

  const handleReactivateCancel = () => {
    if (isReactivating) return
    router.replace(`/${locale}`)
  }

  const config = provider ? PROVIDER_CONFIG[provider] : null
  const Icon = config?.Icon

  if (pendingDeletion) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <ReactivateAccountModal
          open
          loading={isReactivating}
          error={reactivationError}
          onConfirm={handleReactivateConfirm}
          onCancel={handleReactivateCancel}
        />
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] min-w-[300px] overflow-hidden rounded-2xl border border-sop-neutral-grayalpha-100 bg-sop-base-white shadow-[0_4px_24px_var(--color-sop-neutral-grayalpha-100)]">
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
