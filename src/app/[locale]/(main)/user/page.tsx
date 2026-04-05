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
    pathname: "user",
    title: "บัญชีของฉัน",
    description: "ศูนย์จัดการบัญชี คำสั่งซื้อ และการตั้งค่าบน SOPet",
    indexable: false,
  })
}

export default async function UserPage() {
  return redirect(`user/profile`)
}
