import Link from "next/link"
import type { Metadata } from "next"
import { DEFAULT_REGION } from "@/lib/site-defaults"

/** Align with middleware redirect target for paths without a locale prefix */
const defaultLocale = DEFAULT_REGION

export const metadata: Metadata = {
  title: "ไม่พบหน้า",
  description:
    "ไม่พบหน้าที่คุณกำลังมองหา ลองกลับหน้าหลักหรือค้นหาสินค้าบน Sopet",
}

function PawMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse
        cx="44"
        cy="52"
        rx="22"
        ry="18"
        className="fill-sop-primary-300/90"
      />
      <ellipse
        cx="24"
        cy="30"
        rx="10"
        ry="12"
        className="fill-sop-primary-400/85"
        transform="rotate(-18 24 30)"
      />
      <ellipse
        cx="44"
        cy="22"
        rx="9"
        ry="11"
        className="fill-sop-primary-400/85"
      />
      <ellipse
        cx="64"
        cy="30"
        rx="10"
        ry="12"
        className="fill-sop-primary-400/85"
        transform="rotate(18 64 30)"
      />
      <ellipse
        cx="30"
        cy="44"
        rx="8"
        ry="10"
        className="fill-sop-secondary-400/50"
        transform="rotate(-8 30 44)"
      />
      <ellipse
        cx="58"
        cy="44"
        rx="8"
        ry="10"
        className="fill-sop-secondary-400/50"
        transform="rotate(8 58 44)"
      />
    </svg>
  )
}

export default function NotFound() {
  const homeHref = `/${defaultLocale}`
  const searchHref = `/${defaultLocale}/search`

  return (
    <div className="relative min-h-dvh overflow-hidden bg-sop-primary-100">
      <div
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-sop-primary-300/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-sop-secondary-300/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sop-primary-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-4 md:px-6">
          <div
            className="w-full max-w-md rounded-sop-24 bg-sop-base-white px-8 py-10 text-center shadow-[0_24px_48px_-12px_rgba(97,53,148,0.12)] ring-1 ring-sop-neutral-orangealpha-200 md:px-12 md:py-12"
            role="status"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-sop-20 bg-sop-primary-100 ring-1 ring-sop-primary-200/80">
              <PawMark className="h-14 w-14" />
            </div>

            <p
              className="sop-display-md-bold bg-linear-to-br from-sop-primary-600 via-sop-primary-500 to-sop-primary-700 bg-clip-text text-transparent"
              aria-label="404"
            >
              404
            </p>

            <h1 className="mt-3 sop-headline-md-medium text-sop-neutral-gray-200">
              ไม่พบหน้านี้
            </h1>
            <p className="mt-3 sop-body-md-regular text-sop-neutral-gray-400">
              ลิงก์อาจหมดอายุ ถูกย้าย หรือพิมพ์ที่อยู่ไม่ถูกต้อง
              <span className="mt-1 block sop-body-sm-regular text-sop-neutral-gray-400">
                The page you are looking for does not exist or has been moved.
              </span>
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={homeHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-sop-primary-500 px-8 sop-body-md-medium text-sop-base-white shadow-sm transition-colors hover:bg-sop-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sop-primary-600"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
