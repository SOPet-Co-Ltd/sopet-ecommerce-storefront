"use client"

import { Button } from "@/components/atoms"
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

type RenderReviewFilterButtonsProps = {
  starCounts: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  totalReviews: number
}

/**
 * Constant for the rating query param key so it's clear and consistent across the component. PRF = "product review filter"
 */
const RATING_QUERY_KEY = "prf"
const STAR_NUMBERS = [5, 4, 3, 2, 1] as const

export const RenderReviewFilterButtons = ({
  starCounts,
  totalReviews,
}: RenderReviewFilterButtonsProps) => {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const initialRating = searchParams.get(RATING_QUERY_KEY)

  // Local UI state so clicks are immediately reflected without triggering Next.js navigation/refetch
  const [selectedRating, setSelectedRating] = useState<string | null>(
    initialRating
  )

  // Keep local state in sync when search params change from outside this component
  useEffect(() => {
    const current = searchParams.get(RATING_QUERY_KEY)
    setSelectedRating(current)
    // Note: searchParams is a stable object from next/navigation that updates when the URL changes.
  }, [searchParams])

  // Build the list of filter buttons programmatically. This avoids repetitive JSX and makes it easy to
  // add/remove filters later. Return structured groups so we can render them into different containers.
  const { allFilter, starFilters, miscFilters } = useMemo(() => {
    const starFilters = [5, 4, 3, 2, 1].map((n) => ({
      value: String(n),
      label: `${n} ดาว ${starCounts[n as 1 | 2 | 3 | 4 | 5]}`,
    }))

    const miscFilters = [
      { value: "oc", label: "เฉพาะความคิดเห็น" },
      { value: "wi", label: "มีรูปภาพ" },
    ]

    const allFilter = {
      value: null as string | null,
      label: `รีวิวทั้งหมด (${totalReviews})`,
    }

    return { allFilter, starFilters, miscFilters }
  }, [starCounts, totalReviews])

  const handleFilterClick = useCallback(
    (value: string | null) => {
      // Avoid no-op updates: if clicked value matches current selection, do nothing.
      if (selectedRating === value) return
      setSelectedRating(value)
      updateSearchParams(RATING_QUERY_KEY, value)
    },
    [selectedRating, updateSearchParams]
  )

  return (
    <div className="flex flex-col lg:gap-4 gap-3 flex-wrap">
      <div className="flex gap-4 lg:gap-y-4 gap-y-3 flex-wrap">
        <Button
          key={String(allFilter.value ?? "all")}
          onClick={() => handleFilterClick(allFilter.value)}
          variant={selectedRating === allFilter.value ? "secondary" : "neutral"}
          size="sm"
          // className="sop-body-sm-medium px-sop-12px py-sop-4px lg:py-sop-8px lg:px-sop-16px"
        >
          {allFilter.label}
        </Button>

        {starFilters.map((f) => {
          const isActive = selectedRating === f.value
          return (
            <Button
              key={f.value}
              onClick={() => handleFilterClick(f.value)}
              variant={isActive ? "secondary" : "neutral"}
              size="sm"
              // className="sop-body-sm-medium px-sop-12px py-sop-4px lg:py-sop-8px lg:px-sop-16px"
            >
              {f.label}
            </Button>
          )
        })}
      </div>

      <div className="flex gap-4">
        {miscFilters.map((f) => {
          const isActive = selectedRating === f.value
          return (
            <Button
              key={f.value}
              onClick={() => handleFilterClick(f.value)}
              variant={isActive ? "secondary" : "neutral"}
              size="sm"
              // className="sop-body-sm-medium px-sop-12px py-sop-4px lg:py-sop-8px lg:px-sop-16px"
            >
              {f.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
