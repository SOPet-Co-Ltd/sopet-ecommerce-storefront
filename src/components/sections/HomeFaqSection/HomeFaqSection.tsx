"use client"

import { UpArrowIcon } from "@/icons"
import { useCallback, useEffect, useRef, useState } from "react"

export type HomeFaqItem = {
  id: string
  question: string
  answer: string
}

type HomeFaqSectionProps = {
  heading?: string
  items: HomeFaqItem[]
}

export const HomeFaqSection = ({
  heading = "คำถามที่พบบ่อย",
  items,
}: HomeFaqSectionProps) => {
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [contentHeights, setContentHeights] = useState<Record<string, number>>(
    {}
  )

  const measureHeights = useCallback(() => {
    const nextHeights = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = contentRefs.current[item.id]?.scrollHeight ?? 0
      return acc
    }, {})

    setContentHeights(nextHeights)
  }, [items])

  useEffect(() => {
    measureHeights()
    window.addEventListener("resize", measureHeights)

    return () => {
      window.removeEventListener("resize", measureHeights)
    }
  }, [measureHeights])

  const toggleItem = (itemId: string) => {
    setOpenItemId((prevItemId) => (prevItemId === itemId ? null : itemId))
  }

  return (
    <div className="lg:py-sop-80px lg:px-47 py-sop-40px px-sop-12px relative flex flex-col lg:gap-sop-40px gap-sop-20px">
      <div className="text-center">
        <h2 className="sop-body-lg-medium text-sop-neutral-gray-200 md:sop-headline-md-medium">
          {heading}
        </h2>
      </div>
      <div className="z-10 px-sop-16px py-sop-24px md:px-sop-48px pm:y-[36px] flex flex-col gap-sop-20px bg-sop-neutral-whitealpha-800 rounded-sop-16px w-full">
        {items.map((item, index) => {
          const isOpen = openItemId === item.id
          const buttonId = `home-faq-button-${item.id}`
          const panelId = `home-faq-panel-${item.id}`

          return (
            <div
              key={item.id}
              className={"border-b border-sop-neutral-grayalpha-100"}
            >
              <button
                id={buttonId}
                type="button"
                className="flex justify-between items-center w-full py-sop-16px cursor-pointer"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
              >
                <p className="sop-body-sm-medium text-left">{item.question}</p>
                <div className="shrink-0">
                  <UpArrowIcon
                    className={`w-3 h-3 transition-transform text-sop-neutral-gray-300 duration-300 ${
                      isOpen ? "rotate-0" : "rotate-180"
                    }`}
                  />
                </div>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="overflow-hidden"
                style={{
                  maxHeight: isOpen
                    ? `${contentHeights[item.id] ?? 0}px`
                    : "0px",
                  opacity: isOpen ? 1 : 0,
                  transition:
                    "max-height 0.3s ease-in-out, opacity 0.2s ease-in-out",
                }}
              >
                <div
                  ref={(node) => {
                    contentRefs.current[item.id] = node
                  }}
                >
                  <p className="sop-body-sm-light pb-4">{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* primary blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-78.25 bg-sop-primary-500 rounded-full blur-[231px] opacity-40"></div>
      {/* secondary blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-78.25 bg-sop-secondary-500 rounded-full blur-[231px] opacity-40"></div>
    </div>
  )
}
