import { redirect } from "next/navigation"
import { ensureStripeCustomer, verifyCustomer } from "@/lib/data/customer"

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

  const oauth = resolvedSearchParams.oauth

  // Best-effort: ensure Stripe customer is created/linked after OAuth login.
  // The backend endpoint is idempotent, so repeated calls are safe, but
  // this page is only reached immediately after OAuth success.
  if (typeof oauth === "string" && oauth.length > 0) {
    await ensureStripeCustomer()
  }

  // Redirect to the final signed-in destination without any oauth flag,
  // so this side effect will not re-run on normal navigation.
  return redirect(`/${locale}/user/profile`)
}
