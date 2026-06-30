import { redirect } from "next/navigation"
import { OAuthSuccessView } from "@/components/molecules/OAuthSuccessView/OAuthSuccessView"
import { verifyCustomer } from "@/lib/data/customer"
import type { OAuthSuccessProvider } from "@/components/molecules/OAuthSuccessView/OAuthSuccessView"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

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

function normalizeSearchParam(
  value: string | string[] | undefined
): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string" || raw.trim() === "") return null
  return raw.trim()
}

type OAuthSuccessPageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "auth/oauth-success",
    title: "เข้าสู่ระบบสำเร็จ",
    description: "ยืนยันการเข้าสู่ระบบด้วยบัญชีโซเชียลเรียบร้อยแล้ว",
    indexable: false,
  })
}

export default async function OAuthSuccessPage({
  params,
  searchParams,
}: OAuthSuccessPageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const provider = normalizeOAuthProvider(resolvedSearchParams.oauth)
  const pendingDeletion =
    normalizeSearchParam(resolvedSearchParams.pending_deletion) === "true"
  const reactivationToken = normalizeSearchParam(
    resolvedSearchParams.reactivation_token
  )

  if (pendingDeletion && reactivationToken) {
    return (
      <OAuthSuccessView
        locale={locale}
        provider={provider}
        reactivationToken={reactivationToken}
      />
    )
  }

  const user = await verifyCustomer()

  if (!user) {
    return redirect(`/${locale}/login`)
  }

  return <OAuthSuccessView locale={locale} provider={provider} />
}
