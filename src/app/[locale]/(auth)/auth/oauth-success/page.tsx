import { redirect } from "next/navigation"
import { OAuthSuccessView } from "@/components/molecules"
import { ensureStripeCustomer, verifyCustomer } from "@/lib/data/customer"
import type { OAuthSuccessProvider } from "@/components/molecules/OAuthSuccessView/OAuthSuccessView"

const KNOWN_OAUTH_PROVIDERS: OAuthSuccessProvider[] = [
  "google",
  "facebook",
  "line",
]

function normalizeOAuthProvider(
  value: string | string[] | undefined
): OAuthSuccessProvider | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string" || raw.length === 0) return null
  const provider = raw.trim().toLowerCase()
  return KNOWN_OAUTH_PROVIDERS.includes(provider as OAuthSuccessProvider)
    ? (provider as OAuthSuccessProvider)
    : null
}

type OAuthSuccessPageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function OAuthSuccessPage({
  params,
  searchParams,
}: OAuthSuccessPageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const user = await verifyCustomer()

  if (!user) {
    return redirect(`/${locale}/login`)
  }

  const provider = normalizeOAuthProvider(resolvedSearchParams.oauth)

  // Best-effort: ensure Stripe customer is created/linked after OAuth login.
  // The backend endpoint is idempotent, so repeated calls are safe, but
  // this page is only reached immediately after OAuth success.
  if (provider) {
    await ensureStripeCustomer()
  }

  // Show success message then client-side redirect to profile.
  return <OAuthSuccessView locale={locale} provider={provider} />
}
