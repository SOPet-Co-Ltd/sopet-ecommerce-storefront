"use client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { primeCategories } from "@/data/categories"

export const PrimeCategoryNavbar = () => {
  const { category } = useParams()

  return (
    <nav aria-label="หมวดหมู่หลัก" className="flex items-center gap-2">
      {Object.keys(primeCategories).map((key: string) => {
        const isActive = key === category

        return (
          <LocalizedClientLink
            key={key}
            href={`/${key}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "uppercase label-lg px-2 pb-1",
              isActive && "border-b border-primary"
            )}
          >
            {primeCategories[key as keyof typeof primeCategories]}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}
