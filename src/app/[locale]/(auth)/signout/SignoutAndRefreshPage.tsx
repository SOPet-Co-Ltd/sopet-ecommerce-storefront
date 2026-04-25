"use client"

import { Spinner } from "@/components/atoms"
import { finalizeSignout } from "@/lib/data/customer"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const SESSION_STORAGE_PREFIXES_TO_CLEAR = [
  "sopet:promptpay_checkout_lock:",
  "sopet:order_promptpay_continuity:",
]

const SESSION_STORAGE_KEYS_TO_CLEAR = ["orders_initial_tab"]

const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  "sopet_customer_cart_anonymous_checkout_hold_v1",
]

const normalizeNextPath = (value: string | null | undefined): string => {
  if (!value || !value.startsWith("/")) {
    return "/"
  }

  return value
}

const clearLogoutRelevantBrowserState = () => {
  if (typeof window === "undefined") {
    return
  }

  try {
    for (const key of SESSION_STORAGE_KEYS_TO_CLEAR) {
      window.sessionStorage.removeItem(key)
    }

    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i)
      if (!key) continue

      const shouldClearByPrefix = SESSION_STORAGE_PREFIXES_TO_CLEAR.some(
        (prefix) => key.startsWith(prefix)
      )
      const isOrderCardSelection =
        key.startsWith("order_") && key.endsWith("_cardId")

      if (shouldClearByPrefix || isOrderCardSelection) {
        window.sessionStorage.removeItem(key)
      }
    }

    for (const key of LOCAL_STORAGE_KEYS_TO_CLEAR) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Best effort only.
  }
}

export default function SignoutAndRefreshPage({
  locale,
  nextPath,
}: {
  locale: string
  nextPath: string
}) {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      await finalizeSignout()
      clearLogoutRelevantBrowserState()

      if (cancelled) {
        return
      }

      const destination = `/${locale}${normalizeNextPath(nextPath)}`
      const destinationUrl = new URL(destination, window.location.origin)
      destinationUrl.searchParams.set("_logout", Date.now().toString())

      router.replace(destinationUrl.pathname + destinationUrl.search)
      router.refresh()
      window.location.replace(destinationUrl.toString())
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [locale, nextPath, router])

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-sop-neutral-gray-600/30 px-4 py-8">
      <section className="w-full max-w-[420px] rounded-2xl border border-sop-neutral-gray-500 bg-sop-base-white p-6 shadow-sm md:p-8">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sop-primary-200">
          <span className="scale-125">
            <Spinner />
          </span>
        </div>

        <h1 className="sop-h5 mb-2 text-sop-neutral-gray-100">
          Signing you out
        </h1>
        <p className="sop-body-sm-regular text-sop-neutral-gray-300">
          We are clearing your session and refreshing the page for a secure
          logout.
        </p>
      </section>
    </main>
  )
}
