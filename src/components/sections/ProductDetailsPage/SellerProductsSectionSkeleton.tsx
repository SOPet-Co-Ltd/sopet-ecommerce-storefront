export const SellerProductsSectionSkeleton = () => {
  return (
    <section className="w-full my-8">
      <div className="md:px-0 md:mx-0 mx-4 border-b border-sop-primary-500 pb-3 mb-6 flex items-end gap-2">
        <div
          className="h-7 sop-skeleton-shimmer rounded-sop-8px w-56 max-w-[85%] ring-1 ring-sop-neutral-orangealpha-200"
          aria-hidden
        />
      </div>
      <div className="flex gap-3 overflow-x-auto lg:grid md:grid-cols-5 md:gap-4 lg:px-0 px-4 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[168px] md:w-auto md:min-w-0 flex flex-col gap-3 p-1"
          >
            <div
              className="aspect-square sop-skeleton-shimmer rounded-sop-16px md:rounded-sop-24px w-full ring-1 ring-sop-neutral-orangealpha-200 shadow-sm"
              aria-hidden
            />
            <div className="space-y-2 px-0.5">
              <div className="h-3.5 sop-skeleton-shimmer rounded-sop-8px w-[88%] ring-1 ring-sop-neutral-orangealpha-100" />
              <div className="h-3.5 sop-skeleton-shimmer rounded-sop-8px w-1/2 ring-1 ring-sop-neutral-orangealpha-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
