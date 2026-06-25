import type { Metadata } from "next"
import { Mitr } from "next/font/google"
import "./globals.css"
import { Toaster as MedusaToaster } from "@medusajs/ui"
import { Toaster as SonnerToaster } from "sonner"
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_REGION,
} from "@/lib/site-defaults"
import { Providers } from "./providers"
import { GoogleTagManager } from "@next/third-parties/google"
import { GTMPageViewTracker } from "@/components/GTMPageViewTracker"
import { PostHogProvider } from "@/components/PostHogProvider"

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME}`,
    default: process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME,
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || DEFAULT_SITE_DESCRIPTION,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  alternates: {
    languages: {
      "x-default": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root layout doesn't receive params, so use default locale
  // The actual locale is handled by layouts inside [locale] folder
  const locale = DEFAULT_REGION

  // Check if PUBLISHABLE_API_KEY is configured
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!PUBLISHABLE_KEY?.trim()) {
    if (process.env.NODE_ENV === "production") {
      // In production, show error page
      return (
        <html lang={locale || "th"}>
          <body
            className={`${mitr.className} bg-sop-primary-100 text-sop-neutral-gray-300 relative`}
          >
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                  Configuration Error
                </h1>
                <p className="text-gray-700 mb-2">
                  The{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
                  </code>{" "}
                  environment variable is not set.
                </p>
                <p className="text-sm text-gray-500">
                  Please configure this variable in your environment settings to
                  continue.
                </p>
              </div>
            </div>
          </body>
        </html>
      )
    }
    // In development, log error but continue (for development convenience)
    console.error(
      "[Layout] WARNING: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set or is empty."
    )
    console.error(
      "[Layout] This will cause API calls to fail. Please set the environment variable."
    )
  }

  const htmlLang = locale || "th"

  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
  const isProduction = process.env.NODE_ENV === "production"

  return (
    <html lang={htmlLang} className="" suppressHydrationWarning>
      {GTM_ID && isProduction && <GoogleTagManager gtmId={GTM_ID} />}
      <body
        className={`${mitr.className} bg-sop-primary-100 text-sop-neutral-gray-300 relative h-dvh`}
      >
        {GTM_ID && isProduction && <GTMPageViewTracker />}
        <PostHogProvider>
          <Providers>{children}</Providers>
        </PostHogProvider>
        <MedusaToaster position="top-right" />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  )
}
