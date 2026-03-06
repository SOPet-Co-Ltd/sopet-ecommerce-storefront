"use client"

import { useRef, useEffect, useState } from "react"
import { UpArrowIcon } from "@/icons"

interface AccordionProps {
  title: string
  children: React.ReactNode
  id: string
}

export const Accordion = ({ title, children, id }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight)
    }
  }, [children])

  const buttonId = `footer-accordion-button-${id}`
  const panelId = `footer-accordion-panel-${id}`

  return (
    <div className="border-b border-sop-neutral-grayalpha-100">
      <button
        id={buttonId}
        type="button"
        className="flex justify-between items-center w-full py-sop-16px cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="sop-body-sm-medium text-left text-sop-neutral-gray-100">
          {title}
        </p>
        <div className="shrink-0">
          <UpArrowIcon
            className={`w-3 h-3 transition-transform text-sop-neutral-gray-100 duration-300 ${
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
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          opacity: isOpen ? 1 : 0,
          transition: "max-height 0.3s ease-in-out, opacity 0.2s ease-in-out",
        }}
      >
        <div ref={contentRef} className="pb-sop-16px">
          {children}
        </div>
      </div>
    </div>
  )
}
