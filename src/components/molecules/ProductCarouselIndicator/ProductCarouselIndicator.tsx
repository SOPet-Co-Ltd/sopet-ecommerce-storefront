"use client"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { EmblaCarouselType } from "embla-carousel"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/atoms"
import { LeftArrowIcon, RightArrowIcon } from "@/icons"
import useEmblaCarousel from "embla-carousel-react"

export const ProductCarouselIndicator = ({
  slides = [],
  embla: parentEmbla,
}: {
  slides: HttpTypes.StoreProduct["images"]
  embla?: EmblaCarouselType
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "x",
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
  })

  const changeSlideHandler = useCallback(
    (index: number) => {
      if (!parentEmbla) return
      parentEmbla.scrollTo(index)
    },
    [parentEmbla]
  )

  const scrollPrevImage = useCallback(() => {
    if (!parentEmbla) return
    parentEmbla.scrollPrev()
  }, [parentEmbla])

  const scrollNextImage = useCallback(() => {
    if (!parentEmbla) return
    parentEmbla.scrollNext()
  }, [parentEmbla])

  const onSelectParent = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  const onSelectThumbs = useCallback((emblaApi: EmblaCarouselType) => {
    // Just update thumbnail carousel state if needed
  }, [])

  useEffect(() => {
    if (!parentEmbla) return

    onSelectParent(parentEmbla)
    parentEmbla.on("reInit", onSelectParent).on("select", onSelectParent)
  }, [parentEmbla, onSelectParent])

  useEffect(() => {
    if (!emblaApi) return

    onSelectThumbs(emblaApi)
    emblaApi.on("reInit", onSelectThumbs).on("select", onSelectThumbs)
  }, [emblaApi, onSelectThumbs])

  return (
    <div className="mt-2 flex items-center gap-2">
      <IconButton
        onClick={scrollPrevImage}
        disabled={!canScrollPrev}
        variant="tonal"
        size="small"
        aria-label="Previous image"
        icon={<LeftArrowIcon size={20} color="#949495" />}
        className={cn("shrink-0", !canScrollPrev && "cursor-not-allowed")}
      />

      <div
        className="embla flex-1 overflow-hidden"
        aria-label="Product image thumbnails"
      >
        <div className="embla__viewport overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-2 justify-center">
            {(slides || []).map((slide, index) => (
              <div
                key={slide.id}
                className="cursor-pointer"
                onClick={() => changeSlideHandler(index)}
              >
                <Image
                  src={decodeURIComponent(slide.url)}
                  alt={`Product thumbnail ${index + 1}`}
                  width={80}
                  height={80}
                  className={cn(
                    "border-4 transition-colors duration-300 w-20 h-20 object-cover",
                    selectedIndex === index
                      ? "border-sop-secondary-500"
                      : "border-sop-base-white"
                  )}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <IconButton
        onClick={scrollNextImage}
        disabled={!canScrollNext}
        variant="tonal"
        size="small"
        aria-label="Next image"
        icon={<RightArrowIcon size={20} color="#949495" />}
        className={cn("shrink-0", !canScrollNext && "cursor-not-allowed")}
      />
    </div>
  )
}
