import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import SignoutAndRefreshPage from "./SignoutAndRefreshPage"

type SignoutPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "signout",
    title: "Sign out",
    description: "Signing out",
    indexable: false,
  })
}

export default async function SignoutPage({
  params,
  searchParams,
}: SignoutPageProps) {
  const { locale } = await params
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? next : "/"

  return <SignoutAndRefreshPage locale={locale} nextPath={nextPath} />
}
