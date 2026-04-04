import { LoginForm } from "@/components/molecules"
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
      "เข้าสู่ระบบบัญชี SOPet เพื่อติดตามคำสั่งซื้อ คูปอง และข้อความจากร้านค้า",
    indexable: false,
  })
}

export default async function LoginPage() {
  const user = await verifyCustomer()

  if (user) {
    redirect("/user")
  }

  return <LoginForm />
}
