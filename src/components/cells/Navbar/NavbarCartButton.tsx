"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { CartSource, useCartQuery } from "@/hooks/useCartQuery"
import { usePrevious } from "@/hooks/usePrevious"
import { UserManagementShoppingBagIcon } from "@/icons"
import { getCartItemCount } from "@/lib/helpers/cart-item-count"
import { cn } from "@/lib/utils"

export const NavbarCartButton = ({ hasUser }: { hasUser: boolean }) => {
  const pathname = usePathname()
  const locale = useMemo(() => pathname.split("/")[1] || "th", [pathname])
  const source: CartSource = hasUser ? "customer" : "anonymous"
  const { data: cart, isLoading } = useCartQuery({
    locale,
    source,
  })

  const itemCount = getCartItemCount(cart)
  const previousItemCount = usePrevious(itemCount)
  const [hasEstablishedBaseline, setHasEstablishedBaseline] = useState(false)
  const [animationNonce, setAnimationNonce] = useState(0)

  useEffect(() => {
    if (hasEstablishedBaseline || isLoading) {
      return
    }

    setHasEstablishedBaseline(true)
  }, [hasEstablishedBaseline, isLoading])

  useEffect(() => {
    if (
      !hasEstablishedBaseline ||
      previousItemCount === undefined ||
      itemCount <= previousItemCount
    ) {
      return
    }

    setAnimationNonce((current) => current + 1)
  }, [hasEstablishedBaseline, itemCount, previousItemCount])

  const displayCount = itemCount > 99 ? "99+" : `${itemCount}`

  return (
    <LocalizedClientLink
      href="/cart"
      className="relative inline-flex"
      aria-label={
        itemCount > 0 ? `ตะกร้าสินค้า ${itemCount} ชิ้น` : "ตะกร้าสินค้า"
      }
    >
      <span className="relative inline-flex items-center justify-center">
        <span
          key={`cart-icon-${animationNonce}`}
          className={cn(
            "relative inline-flex",
            animationNonce > 0 && "motion-safe:animate-[cart-bump_420ms_ease-out]"
          )}
        >
          <UserManagementShoppingBagIcon size={18} color="#454547" />
        </span>

        {itemCount > 0 && (
          <span
            key={`cart-badge-${animationNonce}-${displayCount}`}
            className={cn(
              "absolute -top-2 -right-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sop-system-error-400 px-1 text-[10px] font-semibold leading-none text-sop-base-white shadow-sm",
              animationNonce > 0 &&
                "motion-safe:animate-[cart-bump_420ms_ease-out]"
            )}
          >
            {displayCount}
          </span>
        )}

      </span>
    </LocalizedClientLink>
  )
}
