"use client"
import { CollapseIcon, LeftPointSquareIcon, MeatballsMenuIcon, RightPointSquareIcon } from "@/icons"

export const Pagination = ({
  pages,
  setPage,
  currentPage,
}: {
  pages: number
  setPage: (page: number) => void
  currentPage: number
}) => {
  const renderbuttons = () => {
    const buttons = [] as React.ReactNode[]

    if (currentPage > 2) {
      buttons.push(
        <button key={`gap-left`} disabled aria-label="More pages">
          <MeatballsMenuIcon />
        </button>
      )
    }

    if (currentPage > 1) {
      buttons.push(
        <button
          key={`page-${currentPage - 1}`}
          aria-label={`Go to page ${currentPage - 1}`}
          onClick={() => setPage(currentPage - 1)}
        >
          {currentPage - 1}
        </button>
      )
    }

    buttons.push(
      <button
        key={`page-${currentPage}`}
        aria-label={`Current page, page ${currentPage}`}
      >
        {currentPage}
      </button>
    )

    if (currentPage < pages) {
      buttons.push(
        <button
          key={`page-${currentPage + 1}`}
          aria-label={`Go to page ${currentPage + 1}`}
          onClick={() => setPage(currentPage + 1)}
        >
          {currentPage + 1}
        </button>
      )
    }

    if (currentPage < pages - 1) {
      buttons.push(
        <button key={`gap-right`} disabled aria-label="More pages">
          <MeatballsMenuIcon />
        </button>
      )
    }

    return buttons
  }

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={Boolean(currentPage === 1)}
        onClick={() => setPage(currentPage - 1)}
        className="border-none cursor-pointer"
        aria-label="Previous page"
      >
        <LeftPointSquareIcon size={28} color={Boolean(currentPage <= 1) ? "#22222947" : "#454547"} />
      </button>

      {/* {renderbuttons()} */}
      <div className="flex items-center">
        <p className="sop-body-sm-regular pr-2">หน้า</p>
        <p className="sop-body-sm-regular">{currentPage}</p>
        <p className="sop-body-sm-regular text-sop-neutral-grayalpha-400">/</p>
        <p className="sop-body-sm-regular text-sop-neutral-grayalpha-400">{pages}</p>
      </div>

      <button
        disabled={Boolean(currentPage === pages)}
        onClick={() => setPage(currentPage + 1)}
        className="border-none cursor-pointer"
        aria-label="Next page"
      >
        <RightPointSquareIcon size={28} color={Boolean(currentPage >= pages) ? "#22222947" : "#454547"} />
      </button>
    </div>
  )
}
