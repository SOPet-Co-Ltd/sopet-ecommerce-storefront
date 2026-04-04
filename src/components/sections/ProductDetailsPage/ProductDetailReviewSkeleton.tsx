export const ProductDetailReviewSkeleton = () => {
  return (
    <div className="bg-sop-base-white gap-4 p-4 md:rounded-sop-16px rounded-none md:mt-5 mt-2 ring-1 ring-sop-neutral-orangealpha-200 shadow-[0_1px_0_var(--color-sop-neutral-orangealpha-100)]">
      <div className="border-b mb-4 py-2 border-sop-primary-500/80">
        <div
          className="h-6 sop-skeleton-shimmer rounded-sop-8px w-48 max-w-full ring-1 ring-sop-neutral-orangealpha-100"
          aria-hidden
        />
      </div>
      <div className="grid md:grid-cols-[auto_1fr] p-3 md:p-4 md:grid-rows-1 grid-cols-1 grid-rows-[auto_auto] bg-sop-primary-100 rounded-sop-16px md:gap-12 gap-4 ring-1 ring-sop-primary-200/50">
        <div className="flex flex-col gap-3 md:items-center justify-center">
          <div
            className="h-11 w-[4.5rem] sop-skeleton-shimmer-on-primary rounded-sop-12px ring-1 ring-sop-primary-300/30"
            aria-hidden
          />
          <div className="h-6 w-32 sop-skeleton-shimmer-on-primary rounded-sop-8px hidden md:block ring-1 ring-sop-primary-300/20" />
        </div>
        <div className="space-y-3 flex flex-col justify-center">
          <div className="h-9 sop-skeleton-shimmer-on-primary rounded-sop-12px w-full max-w-md ring-1 ring-sop-primary-300/25" />
          <div className="h-9 sop-skeleton-shimmer-on-primary rounded-sop-12px w-full max-w-sm ring-1 ring-sop-primary-300/25" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-[5.5rem] sop-skeleton-shimmer rounded-sop-16px w-full ring-1 ring-sop-neutral-orangealpha-100" />
        <div className="h-[5.5rem] sop-skeleton-shimmer rounded-sop-16px w-full ring-1 ring-sop-neutral-orangealpha-100" />
      </div>
    </div>
  )
}
