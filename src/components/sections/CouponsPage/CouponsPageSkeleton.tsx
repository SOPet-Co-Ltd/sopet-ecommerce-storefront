function CouponCardSkeleton() {
  return (
    <div
      className="w-full max-w-[320px] min-h-[156px] rounded-xl overflow-hidden flex ring-1 ring-sop-neutral-orangealpha-200 justify-self-center"
      aria-hidden
    >
      <div className="w-[110px] sm:w-[130px] shrink-0 sop-skeleton-shimmer" />
      <div className="flex-1 p-4 flex flex-col gap-2 bg-white">
        <div className="h-4 sop-skeleton-shimmer rounded-sop-8px w-3/4 ring-1 ring-sop-neutral-orangealpha-100" />
        <div className="h-3 sop-skeleton-shimmer rounded-sop-8px w-full ring-1 ring-sop-neutral-orangealpha-100" />
        <div className="h-3 sop-skeleton-shimmer rounded-sop-8px w-2/3 ring-1 ring-sop-neutral-orangealpha-100" />
        <div className="mt-auto h-8 sop-skeleton-shimmer rounded-full w-24 self-end ring-1 ring-sop-neutral-orangealpha-100" />
      </div>
    </div>
  )
}

function SectionSkeleton({ withTitle }: { withTitle?: boolean }) {
  return (
    <section className="flex flex-col items-center w-full max-w-[1299px] mx-auto">
      {withTitle && (
        <div className="h-8 sop-skeleton-shimmer rounded-sop-8px w-48 max-w-[85%] mb-6 sm:mb-8 ring-1 ring-sop-neutral-orangealpha-200 self-start" />
      )}
      <div className="w-full bg-sop-neutral-gray-200 py-2 sm:py-3 flex justify-center mb-6 sm:mb-8 rounded-sop-8px">
        <div className="h-5 sm:h-6 sop-skeleton-shimmer rounded-sop-8px w-40 ring-1 ring-sop-neutral-orangealpha-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center w-full">
        {Array.from({ length: 8 }, (_, i) => (
          <CouponCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

/**
 * Route-level loading UI for /coupons (matches page grid + banner layout).
 */
export function CouponsPageSkeleton() {
  return (
    <div
      className="w-full bg-sop-primary-100 min-h-screen pb-20"
      aria-busy="true"
      aria-label="Loading coupons"
    >
      <div className="relative w-full overflow-hidden h-[180px] sm:h-[250px] md:h-[300px] bg-white flex items-center justify-center">
        <div className="absolute inset-0 sop-skeleton-shimmer ring-1 ring-sop-neutral-orangealpha-100" />
      </div>
      <div className="container mx-auto lg:px-0 -mt-sop-20px sm:mt-8 relative z-20 flex flex-col gap-8 sm:gap-12">
        <SectionSkeleton withTitle />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  )
}
