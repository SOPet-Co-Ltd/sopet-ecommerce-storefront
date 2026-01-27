"use client"

import {
  Button,
  Chip,
  Input,
  StarRating,
  PriceRangeSlider,
} from "@/components/atoms"
import { Accordion, FilterCheckboxOption } from "@/components/molecules"
import useFilters from "@/hooks/useFilters"
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import React, { useEffect, useState, useRef } from "react"
import { useRefinementList } from "react-instantsearch"
import { ProductListingActiveFilters } from "../ProductListingActiveFilters/ProductListingActiveFilters"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { CollapseIcon, FilterFunnelIcon, TagIcon, CloseIcon } from "@/icons"

export const AlgoliaProductSidebar = ({
  currency_code,
  locale,
}: {
  currency_code?: string
  locale?: string
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [userDismissed, setUserDismissed] = useState(false)
  const [prevHasFilters, setPrevHasFilters] = useState(false)
  const bottomSheetRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const { allSearchParams } = useGetAllSearchParams()

  // Monitor filter state changes and open modal only when filters are newly added
  useEffect(() => {
    const hasFilters = Boolean(
      allSearchParams.pet_type ||
      allSearchParams.brand ||
      allSearchParams.min_price ||
      allSearchParams.max_price
    )

    // Only auto-open if:
    // 1. Filters transition from empty to having filters (new filters added)
    // 2. User hasn't manually dismissed the modal
    // 3. Modal is not already open
    // 4. On mobile
    if (
      hasFilters &&
      !prevHasFilters &&
      isMobile &&
      !isOpen &&
      !userDismissed
    ) {
      setIsOpen(true)
      setUserDismissed(false) // Reset dismissal flag when new filters are added
      // Trigger animation after a small delay to ensure DOM is ready
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
    }

    // Update previous filter state
    setPrevHasFilters(hasFilters)

    // Reset dismissal flag when all filters are cleared
    if (!hasFilters) {
      setUserDismissed(false)
    }
  }, [
    searchParams,
    isMobile,
    isOpen,
    allSearchParams,
    prevHasFilters,
    userDismissed,
  ])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    // Check on initial mount
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleClose = () => {
    setIsAnimating(false)
    setUserDismissed(true) // Mark that user manually dismissed the modal
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsOpen(false)
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    setUserDismissed(false) // Reset dismissal flag when user manually opens
    // Trigger animation after a small delay to ensure DOM is ready
    setTimeout(() => {
      setIsAnimating(true)
    }, 10)
  }

  return isMobile ? (
    <>
      <button
        onClick={handleOpen}
        className="w-full rounded-sop-20px overflow-hidden bg-sop-additionalblue-400 px-4 py-3 flex items-center justify-between"
      >
        <div className="gap-2 flex items-center">
          <FilterFunnelIcon color="#FFFFFF" size={16} />
          <p className="sop-body-lg-medium text-sop-base-white">
            ค้นหาแบบละเอียด
          </p>
        </div>
        <div>
          <CollapseIcon
            color={"#FFFFFF"}
            size={24}
            className={cn(
              "transition-all duration-300",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={handleBackdropClick}
          onTouchEnd={handleBackdropClick}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              isAnimating ? "opacity-100" : "opacity-0"
            )}
            onClick={handleBackdropClick}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleClose()
            }}
          />

          {/* Bottom Sheet */}
          <div
            ref={bottomSheetRef}
            className={cn(
              "relative w-full bg-sop-additionalblue-400 rounded-t-sop-20px overflow-hidden shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col",
              isAnimating ? "translate-y-0" : "translate-y-full"
            )}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 bg-sop-additionalblue-400 px-4 py-3">
              <div className="flex items-center gap-2">
                <FilterFunnelIcon color="#FFFFFF" size={16} />
                <p className="sop-body-lg-medium text-sop-base-white">
                  ค้นหาแบบละเอียด
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
              >
                <CloseIcon color="#FFFFFF" size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 bg-sop-base-white">
              <PetTypeFilter defaultOpen={Boolean(allSearchParams.pet_type)} />
              <BrandFilter defaultOpen={Boolean(allSearchParams.brand)} />
              <PriceFilter
                defaultOpen={Boolean(
                  allSearchParams.min_price || allSearchParams.max_price
                )}
                currency_code={currency_code}
                locale={locale}
              />
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="bg-sop-base-white rounded-sop-20px overflow-hidden">
      <div className="flex items-center gap-2 bg-sop-additionalblue-400 px-4 py-3">
        <FilterFunnelIcon color="#FFFFFF" size={16} />
        <p className="sop-body-lg-medium text-sop-base-white">
          ค้นหาแบบละเอียด
        </p>
      </div>
      <PetTypeFilter defaultOpen={Boolean(allSearchParams.pet_type)} />
      <BrandFilter defaultOpen={Boolean(allSearchParams.brand)} />
      <PriceFilter
        defaultOpen={Boolean(
          allSearchParams.min_price || allSearchParams.max_price
        )}
        currency_code={currency_code}
        locale={locale}
      />
    </div>
  )
}

function PetTypeFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const { items } = useRefinementList({
    attribute: "custom_tags_pet_type",
    limit: 100,
    operator: "or",
  })
  const { updateFilters, isFilterActive } = useFilters("pet_type")

  const selectHandler = (option: string) => {
    updateFilters(option)
  }
  return (
    <Accordion heading="ประเภทสัตว์เลี้ยง" defaultOpen={defaultOpen}>
      <ul className="px-4 grid grid-cols-2 gap-4">
        {items.map(({ label, count }) => (
          <li key={label}>
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={Boolean(!count)}
              onCheck={selectHandler}
              label={label}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  )
}

function BrandFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const { items } = useRefinementList({
    attribute: "custom_tags_brand",
    limit: 100,
    operator: "or",
  })
  const { updateFilters, isFilterActive } = useFilters("brand")

  const selectHandler = (option: string) => {
    updateFilters(option)
  }
  return (
    <Accordion heading="แบรนด์" defaultOpen={defaultOpen}>
      <ul className="px-4 grid grid-cols-2 gap-4">
        {items.map(({ label, count }) => (
          <li key={label}>
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={Boolean(!count)}
              onCheck={selectHandler}
              label={label}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  )
}

function PriceFilter({
  defaultOpen = true,
  currency_code,
  locale,
}: {
  defaultOpen?: boolean
  currency_code?: string
  locale?: string
}) {
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [sliderMin, setSliderMin] = useState(0)
  const [sliderMax, setSliderMax] = useState(10000)

  const updateSearchParams = useUpdateSearchParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const MIN_PRICE = 0
  const MAX_PRICE = 10000

  useEffect(() => {
    const minPrice = searchParams.get("min_price")
    const maxPrice = searchParams.get("max_price")
    setMin(minPrice || "")
    setMax(maxPrice || "")

    // Sync slider with URL params
    if (minPrice) {
      setSliderMin(Number(minPrice))
    } else {
      setSliderMin(MIN_PRICE)
    }
    if (maxPrice) {
      setSliderMax(Number(maxPrice))
    } else {
      setSliderMax(MAX_PRICE)
    }
  }, [searchParams])

  const updateMinPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("min_price", min)
  }

  const updateMaxPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("max_price", max)
  }

  const handleApplyFilter = () => {
    const currentSearchParams = new URLSearchParams(searchParams.toString())

    // Update min_price
    if (sliderMin === MIN_PRICE) {
      currentSearchParams.delete("min_price")
    } else {
      currentSearchParams.set("min_price", sliderMin.toString())
    }

    // Update max_price
    if (sliderMax === MAX_PRICE) {
      currentSearchParams.delete("max_price")
    } else {
      currentSearchParams.set("max_price", sliderMax.toString())
    }

    // Update both parameters in a single router push
    router.push(`${pathname}?${currentSearchParams}`, {
      scroll: false,
    })
  }

  const handleClearFilter = () => {
    setMin("")
    setMax("")
    setSliderMin(MIN_PRICE)
    setSliderMax(MAX_PRICE)
    updateSearchParams("min_price", null)
    updateSearchParams("max_price", null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price)
  }

  return (
    <Accordion heading="Price" defaultOpen={defaultOpen}>
      <div className="pb-4">
        <div className="flex gap-2 mb-4">
          <form method="POST" onSubmit={updateMinPriceHandler}>
            <label className="sop-body-xs-light text-sop-neutral-gray-400">
              ราคาต่ำสุด 0 บาท
            </label>
            <Input
              placeholder="ราคาต่ำสุด"
              hasTitle={false}
              size="sm"
              hasStartIcon={true}
              startIcon={<TagIcon color="#949495" size={16} />}
              onChange={(e) => {
                const value = e.target.value
                setMin(value)
                if (value) {
                  const numValue = Number(value)
                  if (!isNaN(numValue)) {
                    setSliderMin(
                      Math.max(MIN_PRICE, Math.min(MAX_PRICE, numValue))
                    )
                  }
                }
              }}
              value={min}
              onBlur={(e) => {
                setTimeout(() => {
                  updateMinPriceHandler(
                    e as unknown as React.FormEvent<HTMLFormElement>
                  )
                }, 500)
              }}
              className="no-arrows-number-input"
            />
            <input type="submit" className="hidden" />
          </form>
          <form method="POST" onSubmit={updateMaxPriceHandler}>
            <label className="sop-body-xs-light text-sop-neutral-gray-400">
              ราคาสูงสุด 10,000 บาท
            </label>
            <Input
              placeholder="ราคาสูงสุด"
              size="sm"
              hasTitle={false}
              hasStartIcon={true}
              startIcon={<TagIcon color="#949495" size={16} />}
              onChange={(e) => {
                const value = e.target.value
                setMax(value)
                if (value) {
                  const numValue = Number(value)
                  if (!isNaN(numValue)) {
                    setSliderMax(
                      Math.max(MIN_PRICE, Math.min(MAX_PRICE, numValue))
                    )
                  }
                }
              }}
              onBlur={(e) => {
                setTimeout(() => {
                  updateMaxPriceHandler(
                    e as unknown as React.FormEvent<HTMLFormElement>
                  )
                }, 500)
              }}
              value={max}
              className="no-arrows-number-input"
            />
            <input type="submit" className="hidden" />
          </form>
        </div>

        {/* Price Range Slider */}
        <div className="mb-4">
          <PriceRangeSlider
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={{ min: sliderMin, max: sliderMax }}
            step={100}
            onRangeChange={(min, max) => {
              setSliderMin(min)
              setSliderMax(max)
              setMin(min.toString())
              setMax(max.toString())
            }}
            currency_code={currency_code}
            locale={locale}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 min-h-8">
          <Button
            variant="secondary"
            size="default"
            onClick={handleClearFilter}
            className="flex-1"
          >
            ล้าง
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={handleApplyFilter}
            className="flex-1"
          >
            ใช้
          </Button>
        </div>
      </div>
    </Accordion>
  )
}
