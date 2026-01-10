"use client"

import { SortUpDownIcon } from "@/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type SortOption =
  | "relevance"
  | "best_selling"
  | "price_asc"
  | "price_desc"
  | "rating_asc"
  | "rating_desc"

interface SortButton {
  value: SortOption
  label: string
}

const sortButtons: SortButton[] = [
  { value: "relevance", label: "ความเกี่ยวข้อง" },
  { value: "best_selling", label: "สินค้าขายดี" },
  { value: "price_asc", label: "ราคาต่ำไปสูง" },
  { value: "price_desc", label: "ราคาสูงไปต่ำ" },
  { value: "rating_asc", label: "คะแนนรีวิวต่ำไปสูง" },
  { value: "rating_desc", label: "คะแนนรีวิวสูงไปต่ำ" },
]

export const ProductSortButtons = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get("sortBy") as SortOption) || "relevance"

  const handleSortChange = (sortValue: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (sortValue === "relevance") {
      params.delete("sortBy")
    } else {
      params.set("sortBy", sortValue)
    }
    
    // Reset to page 1 when sorting changes
    params.delete("page")
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 md:pt-0 pt-2">
      <div className="flex items-center gap-2 shrink-0">
        <SortUpDownIcon color="#949495" size={17} />
        <p className="sop-body-sm-light text-sop-base-black">เรียงตาม</p>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden flex-nowrap min-w-0">
        {sortButtons.map((button) => {
          const isActive = currentSort === button.value
          return (
            <button
              key={button.value}
              onClick={() => handleSortChange(button.value)}
              className="shrink-0"
            >
              <p
                className={`sop-body-sm-medium px-sop-12px py-1 rounded-sop-8px border cursor-pointer ${
                  isActive
                    ? "text-sop-base-white border-sop-primary-500 bg-sop-primary-500"
                    : "text-sop-base-black border-sop-neutral-grayalpha-100"
                }`}
              >
                {button.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

