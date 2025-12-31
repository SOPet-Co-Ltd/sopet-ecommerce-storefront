"use client"
import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

import { ForwardIcon } from "@/icons"
import { useParams, usePathname } from "next/navigation"

interface BreadcrumbsProps {
  items: { label: string; path: string }[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const { locale } = useParams()

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-2">
        {items.map(({ path, label }, index) => {
          const isActive = pathname === `/${locale}${path}`

          return (
            <li key={path} className="inline-flex items-center">
              {/* {index > 0 && <ForwardIcon size={16} color="#949495" />} */}
              {index > 0 && (
                <p className="text-sop-neutral-gray-400 px-2">&gt;</p>
              )}
              <LocalizedClientLink
                href={path}
                className={cn(
                  "inline-flex items-center sop-breadcrumb text-sop-neutral-gray-400",
                  index > 0 && "ml-2",
                  isActive && "text-sop-neutral-gray-200"
                )}
              >
                {label}
              </LocalizedClientLink>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
