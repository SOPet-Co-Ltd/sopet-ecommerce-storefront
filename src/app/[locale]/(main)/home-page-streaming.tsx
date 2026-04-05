import { BannerSection } from "@/components/sections/BannerSection/BannerSection"
import { HomeSponsorsSection } from "@/components/sections/HomeSponsorsSection/HomeSponsorsSection"
import {
  listStorefrontBanners,
  listStorefrontSponsors,
} from "@/lib/data/storefront-config"

export const HomeBannerSkeleton = () => (
  <section
    className="w-full flex flex-col gap-sop-12px"
    aria-busy="true"
    aria-label="Loading banners"
  >
    <div className="relative w-full overflow-hidden bg-sop-neutral-gray-600">
      <div className="aspect-3/1 w-full sop-skeleton-shimmer ring-1 ring-sop-neutral-grayalpha-900/20" />
    </div>
  </section>
)

export const HomeSponsorsSkeleton = () => (
  <div
    className="py-5 px-4 flex flex-col gap-sop-20px w-full"
    aria-busy="true"
    aria-label="Loading sponsors"
  >
    <div className="flex justify-center">
      <div className="h-7 sop-skeleton-shimmer rounded-sop-8px w-48 max-w-[85%] ring-1 ring-sop-neutral-orangealpha-200" />
    </div>
    <div className="grid w-full grid-cols-2 items-center justify-center gap-4 md:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="mx-auto aspect-2/1 w-full max-w-[150px] sop-skeleton-shimmer rounded-sop-8px ring-1 ring-sop-neutral-orangealpha-200"
        />
      ))}
    </div>
  </div>
)

const productTileSkeleton = (key: number) => (
  <li key={key} className="w-full max-w-[223px] justify-self-center">
    <div className="flex flex-col gap-2 w-full">
      <div className="aspect-square sop-skeleton-shimmer rounded-sop-16px md:rounded-sop-24px w-full ring-1 ring-sop-neutral-orangealpha-200 shadow-sm" />
      <div className="h-3.5 sop-skeleton-shimmer rounded-sop-8px w-[88%] ring-1 ring-sop-neutral-orangealpha-100" />
      <div className="h-3.5 sop-skeleton-shimmer rounded-sop-8px w-1/2 ring-1 ring-sop-neutral-orangealpha-100" />
    </div>
  </li>
)

export const HomeRecentOrdersSkeleton = () => (
  <section
    className="w-full"
    aria-busy="true"
    aria-label="Loading recent purchases"
  >
    <div className="mb-5 h-7 sop-skeleton-shimmer rounded-sop-8px w-32 max-w-[50%] ring-1 ring-sop-neutral-orangealpha-200" />
    <div className="w-full overflow-x-auto">
      <ul className="flex gap-3 lg:gap-4 pb-2 min-w-max">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="shrink-0 w-[140px] md:w-[165px]">
            <div className="aspect-square sop-skeleton-shimmer rounded-sop-16px w-full ring-1 ring-sop-neutral-orangealpha-200" />
            <div className="mt-2 h-3 sop-skeleton-shimmer rounded-sop-8px w-4/5 ring-1 ring-sop-neutral-orangealpha-100" />
          </li>
        ))}
      </ul>
    </div>
  </section>
)

export const HomeRecommendedProductsSkeleton = () => (
  <section
    className="w-full"
    aria-busy="true"
    aria-label="Loading recommended products"
  >
    <div className="mb-5 h-7 sop-skeleton-shimmer rounded-sop-8px w-40 max-w-[70%] ring-1 ring-sop-neutral-orangealpha-200" />
    <div className="w-full">
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-2 justify-items-center md:grid-cols-[repeat(auto-fit,minmax(223px,1fr))] md:gap-4">
        {Array.from({ length: 8 }, (_, i) => productTileSkeleton(i))}
      </ul>
    </div>
  </section>
)

export async function HomeBannersSlot() {
  const banners = await listStorefrontBanners()
  return <BannerSection banners={banners} />
}

export async function HomeSponsorsSlot() {
  const sponsors = await listStorefrontSponsors()
  return <HomeSponsorsSection sponsors={sponsors} />
}
