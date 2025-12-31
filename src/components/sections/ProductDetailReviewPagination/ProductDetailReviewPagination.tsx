"use client"

import { Button } from "@/components/atoms"
import { usePagination } from "@/hooks/usePagination"
import { GreaterThanIcon, LessThanIcon } from "@/icons"
import { ReviewMeta } from "@/lib/data/reviews"

type ProductDetailReviewPaginationProps = {
  meta: ReviewMeta
}

export const ProductDetailReviewPagination = ({
  meta,
}: ProductDetailReviewPaginationProps) => {
  const { page, max_page } = meta

  const { setPage, currentPage } = usePagination()

  const getPaginationButtons = () => {
    const buttons = []
    const range = 2

    if (max_page < 1) return []

    // Always show first page
    buttons.push(1)

    // Ellipsis after first page
    if (page > range + 2) {
      buttons.push("...")
    }

    // Pages around current page
    for (
      let i = Math.max(2, page - range);
      i <= Math.min(max_page - 1, page + range);
      i++
    ) {
      buttons.push(i)
    }

    // Ellipsis before last page
    if (page < max_page - (range + 1)) {
      buttons.push("...")
    }

    // Always show last page
    if (max_page > 1) {
      buttons.push(max_page)
    }

    return buttons
  }

  const btnLabels = getPaginationButtons()

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="md:block hidden">
        <Button variant="icon">
          <LessThanIcon
            size={18}
            color={page <= 1 ? "#22222947" : "#22222929"}
          />
        </Button>
      </div>
      <div className="md:hidden block">
        <Button variant="icon">
          <LessThanIcon
            size={12}
            color={page <= 1 ? "#22222947" : "#22222929"}
          />
        </Button>
      </div>
      <div className="flex gap-4">
        {btnLabels.map((label, index) =>
          typeof label === "number" ? (
            <button
              disabled={label === page && currentPage === label}
              className="cursor-pointer aspect-square md:h-sop-28px md:w-sop-28px h-sop-20px w-sop-20px md:sop-body-md-light sop-body-xs-light rounded-md border border-sop-neutral-gray-300 text-sop-neutral-gray-300 disabled:bg-sop-neutral-gray-300 disabled:text-sop-base-white"
              key={`${label}-${index}`}
              onClick={() => setPage(label.toString())}
            >
              {label}
            </button>
          ) : (
            <span
              key={`${label}-${index}`}
              className="self-end text-center md:w-sop-20px w-sop-12px md:sop-body-md-light sop-body-xs-light cursor-default select-none"
            >
              {label}
            </span>
          )
        )}
      </div>
      <div className="md:block hidden">
        <Button variant="icon">
          <GreaterThanIcon
            size={18}
            color={page >= max_page ? "#22222947" : "#22222929"}
          />
        </Button>
      </div>
      <div className="md:hidden block">
        <Button variant="icon">
          <GreaterThanIcon
            size={12}
            color={page >= max_page ? "#22222947" : "#22222929"}
          />
        </Button>
      </div>
    </div>
  )
}
