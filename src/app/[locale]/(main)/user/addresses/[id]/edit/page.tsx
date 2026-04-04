import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

type PageProps = {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  return buildPageMetadata({
    locale,
    pathname: `user/addresses/${id}/edit`,
    title: "แก้ไขที่อยู่",
    description: "อัปเดตรายละเอียดที่อยู่จัดส่ง",
    indexable: false,
  })
}

export default async function EditAddressPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/user/addresses`)
}
