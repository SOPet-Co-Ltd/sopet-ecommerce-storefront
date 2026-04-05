import type { Metadata } from "next"
import { VetAIChatClient } from "./VetAIChatClient"

type VetAIPageParams = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: VetAIPageParams): Promise<Metadata> {
  const { locale } = await params

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "SOPet"
  const canonicalPath = `/${locale}/vet-ai`

  return {
    title: "Vet AI",
    description:
      "ปรึกษาคำถามด้านสุขภาพสัตว์เลี้ยงเบื้องต้นกับผู้ช่วย AI จาก SOPet — ไม่ใช่คำแนะนำทางการแพทย์ที่สมบูรณ์ หากฉุกเฉินโปรดติดต่อสัตวแพทย์",
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      title: `Vet AI | ${siteName}`,
      description:
        "ปรึกษาคำถามด้านสุขภาพสัตว์เลี้ยงเบื้องต้นกับผู้ช่วย AI จาก SOPet",
      url: canonicalPath,
      siteName,
      type: "website",
    },
  }
}

export default async function VetAIPage() {
  return <VetAIChatClient />
}
