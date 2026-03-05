"use client"

import { SmartImage } from "@/components/atoms"
import Link from "next/link"

import { useBannerCarousel } from "./useBannerCarousel"

type BannerSectionItem = {
  id: string
  image_url: string
  name?: string
  href?: string
  order: number
}

type BannerSectionProps = {
  banners?: BannerSectionItem[]
}

const isExternalHref = (href: string): boolean => /^https?:\/\//i.test(href)

export const BannerSection = ({ banners = [] }: BannerSectionProps) => {
  const {
    loopedBanners,
    currentIndex,
    displayIndex,
    hasLoop,
    isDragging,
    dragOffsetPx,
    isTransitionEnabled,
    goToIndex,
    startDrag,
    moveDrag,
    endDrag,
    handleTransitionEnd,
    preventDragStart,
    preventClickAfterDrag,
  } = useBannerCarousel({ banners })

  const totalBanners = banners.length

  if (!totalBanners) {
    return null
  }

  return (
    <section className="w-full flex flex-col gap-sop-12px">
      <div
        className={`relative w-full overflow-hidden bg-sop-neutral-gray-600 select-none touch-pan-y ${
          hasLoop ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onMouseDown={(event) => startDrag(event.clientX)}
        onMouseMove={(event) => moveDrag(event.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(event) => startDrag(event.touches[0]?.clientX ?? 0)}
        onTouchMove={(event) => moveDrag(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
        onDragStart={preventDragStart}
      >
        <div
          className={`flex aspect-3/1 transition-transform ease-in-out ${
            isDragging || !isTransitionEnabled ? "duration-0" : "duration-500"
          }`}
          style={{
            transform: `translateX(calc(-${displayIndex * 100}% + ${dragOffsetPx}px))`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopedBanners.map((banner, index) => {
            const key = `${banner.id}-${index}`
            const image = (
              <SmartImage
                fetchPriority="auto"
                src={banner.image_url}
                alt={banner.name || "Banner"}
                width={1440}
                height={480}
                className="h-full w-full object-cover"
              />
            )

            if (!banner.href) {
              return (
                <div
                  key={key}
                  className="w-full shrink-0 grow-0 basis-full"
                  onClickCapture={preventClickAfterDrag}
                >
                  {image}
                </div>
              )
            }

            if (isExternalHref(banner.href)) {
              return (
                <a
                  key={key}
                  href={banner.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full shrink-0 grow-0 basis-full"
                  onClickCapture={preventClickAfterDrag}
                >
                  {image}
                </a>
              )
            }

            return (
              <Link
                href={banner.href}
                key={key}
                className="w-full shrink-0 grow-0 basis-full"
                onClickCapture={preventClickAfterDrag}
              >
                {image}
              </Link>
            )
          })}
        </div>

        <div className="absolute right-sop-12px bottom-sop-12px rounded-sop-100px bg-sop-neutral-grayalpha-900 px-sop-12px py-sop-4px">
          {hasLoop && (
            <div className="flex items-center justify-center gap-sop-8px">
              {banners.map((banner, index) => {
                const isActive = index + 1 === currentIndex

                return (
                  <button
                    type="button"
                    key={banner.id}
                    onClick={() => goToIndex(index)}
                    className={`h-sop-8px rounded-sop-100px transition-all ${
                      isActive
                        ? "w-sop-24px bg-sop-primary-500"
                        : "w-sop-8px bg-sop-neutral-gray-400"
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={isActive ? "true" : "false"}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
