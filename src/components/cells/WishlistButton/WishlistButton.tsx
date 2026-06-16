"use client"

import { WishListHeartIcon } from "@/icons"
import { addWishlistItem, removeWishlistItem } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { useRouter, useParams } from "next/navigation"

export const WishlistButton = ({
  productId,
  wishlist,
  user,
}: {
  productId: string
  wishlist?: Wishlist[]
  user?: HttpTypes.StoreCustomer | null
}) => {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string
  const [isWishlistAdding, setIsWishlistAdding] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(
    wishlist?.[0]?.products?.some((item) => item.id === productId)
  )

  useEffect(() => {
    setIsWishlisted(
      wishlist?.[0]?.products?.some((item) => item.id === productId)
    )
  }, [wishlist, productId])

  const handleAddToWishlist = async () => {
    try {
      setIsWishlistAdding(true)
      await addWishlistItem({
        reference_id: productId,
        reference: "product",
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsWishlistAdding(false)
    }
  }

  const handleRemoveFromWishlist = async () => {
    try {
      setIsWishlistAdding(true)

      await removeWishlistItem({ product_id: productId })
    } catch (error) {
      console.error(error)
    } finally {
      setIsWishlistAdding(false)
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!user) {
            router.push(`/${locale}/user`)
            return
          }
          if (isWishlisted) {
            handleRemoveFromWishlist()
          } else {
            handleAddToWishlist()
          }
        }}
        disabled={isWishlistAdding}
        className="cursor-pointer"
        aria-busy={isWishlistAdding}
        aria-label={
          isWishlistAdding
            ? isWishlisted
              ? "กำลังลบจากรายการโปรด"
              : "กำลังเพิ่มในรายการโปรด"
            : isWishlisted
              ? "ลบจากรายการโปรด"
              : "เพิ่มในรายการโปรด"
        }
        aria-pressed={isWishlisted}
      >
        <WishListHeartIcon size={30} filled={isWishlisted} aria-hidden="true" />
      </button>
      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isWishlistAdding && isWishlisted && "กำลังลบจากรายการโปรด"}
        {isWishlistAdding && !isWishlisted && "กำลังเพิ่มในรายการโปรด"}
      </div>
    </>
  )
}
