import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/notifications",
    title: "การแจ้งเตือน",
    description: "ดูการแจ้งเตือนและอัปเดตในบัญชี Sopet ของคุณ",
    indexable: false,
  })
}

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
