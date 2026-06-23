import { BannerSection } from "@/components/sections/BannerSection/BannerSection"
import { HomeFaqSection } from "@/components/sections/HomeFaqSection/HomeFaqSection"
import { HomeFooterSection } from "@/components/sections/HomeFooterSection/HomeFooterSection"
import { HomeRecommendedProductSection } from "@/components/sections/HomeRecommendedProductSection/HomeRecommendedProductSection"
import { HomeRecentOrdersSection } from "@/components/sections/HomeRecentOrdersSection/HomeRecentOrdersSection"
import { HomeSponsorsSection } from "@/components/sections/HomeSponsorsSection/HomeSponsorsSection"

import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import { toHreflang } from "@/lib/helpers/hreflang"
import {
  listStorefrontBanners,
  listStorefrontSponsors,
} from "@/lib/data/storefront-config"
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
} from "@/lib/site-defaults"
import { getAuthHeaders } from "@/lib/data/cookies"
import { getRequestBaseUrl } from "@/lib/helpers/request-base-url"
import { Suspense } from "react"
import type { HomeFaqItem } from "@/components/sections/HomeFaqSection/HomeFaqSection"
import ChatWithAdminFloatingButton from "@/components/molecules/ChatWithAdminFloatingButton/ChatWithAdminFloatingButton"

const HOME_FAQ_ITEMS: HomeFaqItem[] = [
  {
    id: "authentic-products",
    question: "สินค้าในเว็บเป็น ของแท้ ใช้ไหม ?",
    answer:
      "สินค้าและยาของเรามาจากรพ.ที่จดทะเบียนถูกต้อง 100% บริษัทของเรายังได้รับการสนับสนุนโดยคณะนวัตกรรมบูรณาการ (SCII) จุฬาลงกรณ์มหาวิทยาลัย",
  },
  {
    id: "shipping-methods",
    question: "Sopet ใช้ขนส่งแบบไหน และจัดส่งภายในกี่วัน ?",
    answer:
      "ยี่ห้อขนส่งของเราอาจจะขึ้นอยู่กับรพ.ที่จัดส่ง โดยปกติจะมี Flash และไปรษณีย์ไทย โดยเป็นการส่งด่วนใน 1-2 วัน",
  },
  {
    id: "contact-us",
    question: "หากพบปัญหา สามารถสอบถาม และติดต่อผ่านช่องทางไหนได้บ้าง ?",
    answer:
      'สามารถกดที่ปุ่ม "ติดต่อทีมงาน" มุมขวาล่าง หรือโทร 096-876-5031 ได้เลย',
  },
  {
    id: "about-us",
    question: "Sopet คืออะไร",
    answer:
      "เราเป็นเว็บไซต์แพลตฟอร์มที่ค้นหายาและสินค้าราคาถูกที่สุดจากรพ.และร้านขายยาสัตว์ทั่วไทย พร้อมดีลโค้ดลด ส่วนลดพิเศษ",
  },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const headersList = await headers()
  const baseUrl = getRequestBaseUrl(
    headersList,
    process.env.NEXT_PUBLIC_BASE_URL
  )

  // Build alternates based on available regions (locales)
  let languages: Record<string, string> = {}
  try {
    const regions = await listRegions()
    const locales = Array.from(
      new Set(
        (regions || [])
          .map((r) => r.countries?.map((c) => c.iso_2) || [])
          .flat()
          .filter(Boolean)
      )
    ) as string[]

    languages = locales.reduce<Record<string, string>>((acc, code) => {
      const hrefLang = toHreflang(code)
      acc[hrefLang] = `${baseUrl}/${code}`
      return acc
    }, {})
  } catch {
    // Fallback: only current locale
    languages = { [toHreflang(locale)]: `${baseUrl}/${locale}` }
  }

  const title = "หน้าหลัก"
  const description = DEFAULT_SITE_DESCRIPTION
  const ogImage = "/opengraph-image"
  const canonical = `${baseUrl}/${locale}`

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": baseUrl,
      },
    },
    openGraph: {
      title: `${title} | ${
        process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME
      }`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME,
      type: "website",
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
    },
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [sponsors, banners] = await Promise.allSettled([
    listStorefrontSponsors(),
    listStorefrontBanners(),
  ])

  const headersList = await headers()
  const baseUrl = getRequestBaseUrl(
    headersList,
    process.env.NEXT_PUBLIC_BASE_URL
  )

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME

  if (sponsors.status === "rejected" || banners.status === "rejected") {
    return <div>Error loading storefront config</div>
  }

  const sponsorsData = sponsors.status === "fulfilled" ? sponsors.value : []
  const bannersData = banners.status === "fulfilled" ? banners.value : []

  const authHeaders = await getAuthHeaders()
  const isSignedIn =
    "authorization" in authHeaders && Boolean(authHeaders.authorization)

  return (
    <main className="flex flex-col row-start-2 items-center sm:items-start text-primary w-full">
      {/* Organization JSON-LD */}
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/favicon.ico`,
          }),
        }}
      />
      {/* WebSite JSON-LD */}
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteName,
            url: `${baseUrl}/${locale}`,
            inLanguage: toHreflang(locale),
          }),
        }}
      />
      {/* Product Banner Section */}
      <header className="w-full">
        <BannerSection banners={bannersData} />
      </header>

      {/* Body section */}
      <section className="relative w-full">
        <ChatWithAdminFloatingButton />
        <section className="flex flex-col gap-5 md:gap-10 w-full p-4 lg:py-10 lg:px-20">
          {/* <div className="w-full">
            <HomeCouponSection />
          </div> */}

          {/* Bought items — only for signed-in customers */}
          {isSignedIn ? (
            <div className="w-full">
              <Suspense fallback={null}>
                <HomeRecentOrdersSection locale={locale} />
              </Suspense>
            </div>
          ) : null}

          {/* Recommended Products Section */}
          <div className="w-full">
            <Suspense
              fallback={
                <div className="px-4 py-6 sop-body-md-medium text-sop-neutral-gray-200">
                  กำลังโหลดสินค้าแนะนำ...
                </div>
              }
            >
              <HomeRecommendedProductSection
                heading="สินค้าแนะนำ"
                locale={locale}
              />
            </Suspense>
          </div>
        </section>

        <section className="w-full lg:px-20 lg:py-10 p-0 flex flex-col gap-10 bg-sop-base-white overflow-hidden">
          <HomeSponsorsSection sponsors={sponsorsData} />
          <HomeFaqSection items={HOME_FAQ_ITEMS} />
        </section>
      </section>

      {/* Footer Section */}
      <HomeFooterSection />
    </main>
  )
}
