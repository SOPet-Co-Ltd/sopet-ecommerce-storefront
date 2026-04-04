import { HOME_COUPON_SCROLL_ROW_CLASS } from "./home-coupon-section-layout"

export function HomeCouponSectionSkeleton() {
  return (
    <section
      className="w-full mb-12"
      aria-busy="true"
      aria-label="Loading coupons"
    >
      <div className="flex justify-between items-center px-4 md:px-0 mb-6">
        <div className="h-8 sop-skeleton-shimmer rounded-sop-8px w-36 max-w-[50%] ring-1 ring-sop-neutral-orangealpha-200" />
        <div className="h-5 sop-skeleton-shimmer rounded-sop-8px w-28 ring-1 ring-sop-neutral-orangealpha-100 hidden sm:block" />
      </div>
      <div className={HOME_COUPON_SCROLL_ROW_CLASS}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="w-[280px] shrink-0 snap-start sm:w-[320px] min-h-[156px] rounded-xl overflow-hidden flex ring-1 ring-sop-neutral-orangealpha-200"
          >
            <div className="w-[110px] sm:w-[130px] shrink-0 sop-skeleton-shimmer" />
            <div className="flex-1 p-4 flex flex-col gap-2 bg-white">
              <div className="h-4 sop-skeleton-shimmer rounded-sop-8px w-3/4 ring-1 ring-sop-neutral-orangealpha-100" />
              <div className="h-3 sop-skeleton-shimmer rounded-sop-8px w-full ring-1 ring-sop-neutral-orangealpha-100" />
              <div className="h-3 sop-skeleton-shimmer rounded-sop-8px w-2/3 ring-1 ring-sop-neutral-orangealpha-100" />
              <div className="mt-auto h-8 sop-skeleton-shimmer rounded-full w-24 self-end ring-1 ring-sop-neutral-orangealpha-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
