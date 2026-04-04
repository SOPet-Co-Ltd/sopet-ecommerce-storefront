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
    pathname: "coupons",
    title: "คูปองและโปรโมชัน",
    description:
      "รวบรวมคูปองส่วนลดและดีลพิเศษสำหรับสินค้าสัตว์เลี้ยงจากร้านค้าและโรงพยาบาลที่ร่วมรายการบน SOPet",
    indexable: true,
  })
}

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
