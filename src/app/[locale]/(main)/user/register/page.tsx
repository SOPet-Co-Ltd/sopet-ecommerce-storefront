import { RegisterForm } from "@/components/molecules"
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
    pathname: "user/register",
    title: "สมัครสมาชิก",
    description:
      "สร้างบัญชี Sopet เพื่อสั่งซื้อสินค้าสัตว์เลี้ยง เก็บคูปอง และติดตามคำสั่งซื้อ",
    indexable: true,
  })
}

export default async function Page() {
  const user = await verifyCustomer()

  if (user) {
    redirect("/user")
  }

  return <RegisterForm />
}
