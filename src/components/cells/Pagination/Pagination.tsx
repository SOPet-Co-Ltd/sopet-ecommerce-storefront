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
    <div className="flex items-center">
      <button
        disabled={Boolean(currentPage === 1)}
        onClick={() => setPage(currentPage - 1)}
        className="border-none"
        aria-label="Previous page"
      >
        <LeftPointSquareIcon size={28} />
      </button>

      {renderbuttons()}

      <button
        disabled={Boolean(currentPage === pages)}
        onClick={() => setPage(currentPage + 1)}
        className="border-none"
        aria-label="Next page"
      >
        <RightPointSquareIcon size={28} />
      </button>
    </div>
  )
}
