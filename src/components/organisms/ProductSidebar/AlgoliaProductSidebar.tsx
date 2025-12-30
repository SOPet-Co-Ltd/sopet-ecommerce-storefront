"use client"

import { Button, Chip, Input, StarRating } from "@/components/atoms"
import { Accordion, FilterCheckboxOption, Modal } from "@/components/molecules"
import useFilters from "@/hooks/useFilters"
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useRefinementList } from "react-instantsearch"
import { ProductListingActiveFilters } from "../ProductListingActiveFilters/ProductListingActiveFilters"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { FilterFunnelIcon } from "@/icons"

export const AlgoliaProductSidebar = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const { allSearchParams } = useGetAllSearchParams()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // return isMobile ? (
  //   <>
  //     <Button onClick={() => setIsOpen(true)} variant="default">
  //       Filters
  //     </Button>
  //     {isOpen && (
  //       <Modal heading="Filters" onClose={() => setIsOpen(false)}>
  //         <div className="px-4">
  //           <ProductListingActiveFilters />
  //           <PetTypeFilter defaultOpen={Boolean(allSearchParams.pet_type)} />
  //           <BrandFilter defaultOpen={Boolean(allSearchParams.brand)} />
  //           <PriceFilter
  //             defaultOpen={Boolean(
  //               allSearchParams.min_price || allSearchParams.max_price
  //             )}
  //           />
  //         </div>
  //       </Modal>
  //     )}
  //   </>
  // ) : (
  //   <div>
  //     <PetTypeFilter />
  //     <BrandFilter />
  //     <PriceFilter />
  //   </div>
  // )

  return (
    <div className="bg-sop-base-white rounded-sop-20px overflow-hidden">
      <div className="flex items-center gap-2 bg-sop-additionalblue-400 px-4 py-3">
        <FilterFunnelIcon color="#FFFFFF" size={16} />
        <p className="sop-body-lg-medium text-sop-base-white">ค้นหาแบบละเอียด</p>
      </div>
      <PetTypeFilter defaultOpen={false} />
      <BrandFilter defaultOpen={false} />
      <PriceFilter defaultOpen={false} />
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
      <ul className="px-4">
        {items.map(({ label, count }) => (
          <li key={label} className="mb-4">
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
      <ul className="px-4">
        {items.map(({ label, count }) => (
          <li key={label} className="mb-4">
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

function PriceFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")

  const updateSearchParams = useUpdateSearchParams()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMin(searchParams.get("min_price") || "")
    setMax(searchParams.get("max_price") || "")
  }, [searchParams])

  const updateMinPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("min_price", min)
  }

  const updateMaxPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("max_price", max)
  }
  return (
    <Accordion heading="Price" defaultOpen={defaultOpen}>
      <div className="flex gap-2 mb-4">
        <form method="POST" onSubmit={updateMinPriceHandler}>
          <Input
            placeholder="Min"
            onChange={(e) => setMin(e.target.value)}
            value={min}
            onBlur={(e) => {
              setTimeout(() => {
                updateMinPriceHandler(
                  e as unknown as React.FormEvent<HTMLFormElement>
                )
              }, 500)
            }}
            type="number"
            className="no-arrows-number-input"
          />
          <input type="submit" className="hidden" />
        </form>
        <form method="POST" onSubmit={updateMaxPriceHandler}>
          <Input
            placeholder="Max"
            onChange={(e) => setMax(e.target.value)}
            onBlur={(e) => {
              setTimeout(() => {
                updateMaxPriceHandler(
                  e as unknown as React.FormEvent<HTMLFormElement>
                )
              }, 500)
            }}
            value={max}
            type="number"
            className="no-arrows-number-input"
          />
          <input type="submit" className="hidden" />
        </form>
      </div>
    </Accordion>
  )
}