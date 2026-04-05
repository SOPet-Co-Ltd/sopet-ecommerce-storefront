import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "search",
    title: "ค้นหาสินค้า",
    description:
      "ค้นหายาและสินค้าสำหรับสัตว์เลี้ยงจากร้านค้าและโรงพยาบาลที่ร่วมรายการบน SOPet",
    indexable: true,
  })
}

export default function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
    </div>
  )
}
