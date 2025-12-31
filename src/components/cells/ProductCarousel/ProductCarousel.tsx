"use client"

import useEmblaCarousel from "embla-carousel-react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { ProductCarouselIndicator } from "@/components/molecules"
import { Fragment, useEffect, useState } from "react"

export const ProductCarousel = ({
  slides = [],
}: {
  slides: HttpTypes.StoreProduct["images"]
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "x",
    loop: true,
    align: "start",
  })

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on("select", onSelect)
    // Set initial index
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  return (
    <div className="w-full relative">
      <div
        className="overflow-hidden"
        aria-roledescription="carousel"
        aria-label="Product images"
        ref={emblaRef}
      >
        <div className="flex">
          {(slides || []).map((slide, idx) => (
            <Fragment key={slide.id}>
              <div className="flex-[0_0_100%] min-w-0 relative">
                <Image
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  src={decodeURIComponent(slide.url)}
                  alt="Product image"
                  width={700}
                  height={700}
                  quality={idx === 0 ? 85 : 70}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="w-full h-auto aspect-square object-cover object-center pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* if slide has more than 1 image */}
      {slides && slides.length > 1 && (
        <>
          <div className="md:block hidden">
            <ProductCarouselIndicator slides={slides} embla={emblaApi} />
          </div>
          <div className="block md:hidden">
            <div className="absolute bottom-4 right-2 bg-sop-neutral-whitealpha-800 rounded-sop-12px px-sop-16px py-1.5">
              <span className="sop-body-xs-regular">
                {selectedIndex + 1}/{slides.length}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
