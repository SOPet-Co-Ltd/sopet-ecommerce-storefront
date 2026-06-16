"use client"
import { Card } from "@/components/atoms"
import { CollapseIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, useId } from "react"

export const Accordion = ({
  children,
  heading,
  defaultOpen = true,
}: {
  children: React.ReactNode
  heading: string
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()

  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight)
      }
    }, 100)
  }, [children])

  const openHandler = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="py-sop-12px px-sop-12px">
      <button
        type="button"
        onClick={openHandler}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex justify-between items-center cursor-pointer w-full text-left"
      >
        <h4 className="sop-body-md-regular text-sop-neutral-gray-300">
          {heading}
        </h4>
        <CollapseIcon
          color={"#949495"}
          size={20}
          aria-hidden="true"
          className={cn("transition-all duration-300", isOpen && "rotate-180")}
        />
      </button>
      <div
        id={contentId}
        className={cn("transition-all duration-300 overflow-hidden")}
        style={{
          maxHeight: isOpen ? `${height}px` : "0px",
          opacity: isOpen ? 1 : 0,
          transition: "max-height 0.3s ease-in-out, opacity 0.2s ease-in-out",
        }}
      >
        <div ref={contentRef} className="pt-4">
          {children}
        </div>
      </div>
    </div>
  )
}
