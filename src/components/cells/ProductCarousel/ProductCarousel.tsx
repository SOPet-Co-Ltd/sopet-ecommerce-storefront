"use client"

import useEmblaCarousel from "embla-carousel-react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { ProductCarouselIndicator } from "@/components/molecules"
import { Fragment, useEffect, useState, useCallback } from "react"
import { CloseIcon, LeftArrowIcon, RightArrowIcon } from "@/icons"

export const ProductCarousel = ({
  slides = [],
}: {
  slides: HttpTypes.StoreProduct["images"]
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "x",
    loop: true,
    align: "start",
  })

  // Lightbox carousel
  const [lightboxEmblaRef, lightboxEmblaApi] = useEmblaCarousel({
    axis: "x",
    loop: true,
    align: "start",
    startIndex: lightboxStartIndex,
  })

  const [lightboxSelectedIndex, setLightboxSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

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

  // Lightbox carousel handlers
  useEffect(() => {
    if (!lightboxEmblaApi) return
    const onSelect = () => {
      setLightboxSelectedIndex(lightboxEmblaApi.selectedScrollSnap())
      setCanScrollPrev(lightboxEmblaApi.canScrollPrev())
      setCanScrollNext(lightboxEmblaApi.canScrollNext())
    }
    lightboxEmblaApi.on("select", onSelect)
    onSelect()
    return () => {
      lightboxEmblaApi.off("select", onSelect)
    }
  }, [lightboxEmblaApi])

  // Reset lightbox carousel when opening
  useEffect(() => {
    if (isLightboxOpen && lightboxEmblaApi) {
      lightboxEmblaApi.scrollTo(lightboxStartIndex)
    }
  }, [isLightboxOpen, lightboxEmblaApi, lightboxStartIndex])

  const handleImageClick = (index: number) => {
    // Only allow lightbox on desktop (lg and above)
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setLightboxStartIndex(index)
      setIsLightboxOpen(true)
    }
  }

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false)
  }

  const scrollPrev = useCallback(() => {
    if (lightboxEmblaApi) lightboxEmblaApi.scrollPrev()
  }, [lightboxEmblaApi])

  const scrollNext = useCallback(() => {
    if (lightboxEmblaApi) lightboxEmblaApi.scrollNext()
  }, [lightboxEmblaApi])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox()
      } else if (e.key === "ArrowLeft") {
        scrollPrev()
      } else if (e.key === "ArrowRight") {
        scrollNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLightboxOpen, scrollPrev, scrollNext])

  return (
    <>
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
                    className="w-full h-auto aspect-square object-cover object-center lg:cursor-pointer cursor-default select-none pointer-events-none lg:pointer-events-auto"
                    draggable={false}
                    onClick={() => handleImageClick(idx)}
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

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sop-neutral-grayalpha-500 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-10 w-[30px] h-[30px] flex items-center justify-center rounded-full bg-sop-neutral-gray-300 hover:bg-sop-neutral-gray-400 transition-colors"
            aria-label="Close lightbox"
          >
            <CloseIcon size={20} color="#f5f5f5" />
          </button>

          {/* Navigation arrows */}
          {slides && slides.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="absolute left-4 z-10 w-[30px] h-[30px] flex items-center justify-center rounded-full bg-sop-neutral-whitealpha-700 hover:bg-sop-neutral-whitealpha-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous image"
              >
                <div className="flex items-center justify-center">
                  <LeftArrowIcon size={8} color="#211f23" />
                </div>
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="absolute right-4 z-10 w-[30px] h-[30px] flex items-center justify-center rounded-full bg-sop-neutral-whitealpha-700 hover:bg-sop-neutral-whitealpha-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next image"
              >
                <div className="flex items-center justify-center">
                  <RightArrowIcon size={8} color="#211f23" />
                </div>
              </button>
            </>
          )}

          {/* Carousel container */}
          <div
            className="w-full h-full flex items-center justify-center px-4 md:px-8 lg:px-16"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div
              className="overflow-hidden w-full h-full max-w-[85vw] max-h-[85vh]"
              ref={lightboxEmblaRef}
            >
              <div className="flex h-full">
                {(slides || []).map((slide) => (
                  <div
                    key={slide.id}
                    className="flex-[0_0_100%] min-w-0 flex items-center justify-center h-full"
                  >
                    <Image
                      src={decodeURIComponent(slide.url)}
                      alt="Product image"
                      width={2000}
                      height={2000}
                      quality={95}
                      className="w-full h-full max-w-full max-h-full object-contain"
                      draggable={false}
                      sizes="100vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
