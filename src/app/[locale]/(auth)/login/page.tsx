import {
  LoginForm,
  type LoginNotice,
} from "@/components/molecules/LoginForm/LoginForm"
import { verifyCustomer } from "@/lib/data/customer"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "login",
    title: "เข้าสู่ระบบ",
    description:
      "เข้าสู่ระบบบัญชี Sopet เพื่อติดตามคำสั่งซื้อ คูปอง และข้อความจากร้านค้า",
    indexable: false,
  })
}

function resolveLoginNotice(
  searchParams: Record<string, string | string[] | undefined>
): LoginNotice {
  if (searchParams.sessionExpired === "true") {
    return "sessionExpired"
  }
  if (searchParams.sessionRequired === "true") {
    return "sessionRequired"
  }
  return null
}

type LoginPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await verifyCustomer()

  if (user) {
    redirect("/user")
  }

  const resolvedSearchParams = await searchParams
  const notice = resolveLoginNotice(resolvedSearchParams)

  return <LoginForm notice={notice} />
}
