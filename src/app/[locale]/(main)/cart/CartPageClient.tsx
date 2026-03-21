"use client"

import { useEffect, useState, useRef } from "react"
import type { Cart } from "@/types/cart"
import { CartTemplate } from "@/components/organisms"
import {
  buildAnonymousCartFromLocal,
  updateAnonymousCartItemQuantity,
  deleteAnonymousCartItem,
  changeAnonymousCartItemVariant,
} from "@/lib/data/local-customer-cart"
import {
  updateCustomerCartItem,
  deleteCustomerCartItem,
  changeCustomerCartItemVariant,
} from "@/lib/data/customer-cart"
import { getCustomerCartForClient } from "@/lib/actions/customer-cart-page"
import { listProducts } from "@/lib/data/products"
import type { HttpTypes } from "@medusajs/types"

type CartPageClientProps = {
  initialCart: Cart | HttpTypes.StoreCart | null
  locale: string
}

export const CartPageClient = ({
  initialCart,
  locale,
}: CartPageClientProps) => {
  const [cart, setCart] = useState<Cart | HttpTypes.StoreCart | null>(
    initialCart
  )
  const enrichedAnonymousRef = useRef(false)
  const customerQuantityCheckDoneRef = useRef(false)

  useEffect(() => {
    if (initialCart) {
      return
    }

    const anonymousCart = buildAnonymousCartFromLocal()
    setCart(anonymousCart)
    enrichedAnonymousRef.current = false
  }, [initialCart])

  // On enter: cap customer cart item quantities at inventory
  useEffect(() => {
    if (
      !initialCart ||
      cart?.id === "anonymous-local-cart" ||
      !cart?.items?.length
    ) {
      return
    }
    if (customerQuantityCheckDoneRef.current) return

    const needsCap = cart.items.filter(
      (i) =>
        typeof (i as { max_quantity?: number }).max_quantity === "number" &&
        Number((i as { max_quantity?: number }).max_quantity) >= 0 &&
        Number(i.quantity) > (i as { max_quantity?: number }).max_quantity!
    )
    if (!needsCap.length) {
      customerQuantityCheckDoneRef.current = true
      return
    }

    customerQuantityCheckDoneRef.current = true
    Promise.all(
      needsCap.map((i) =>
        updateCustomerCartItem({
          id: i.id,
          quantity: (i as { max_quantity?: number }).max_quantity!,
        })
      )
    )
      .then(() => getCustomerCartForClient(locale))
      .then((next) => setCart(next))
      .catch(() => {})
  }, [initialCart, cart?.id, cart?.items, locale])

  // Enrich anonymous cart with variant inventory so CartItem can show max and disable +
  useEffect(() => {
    if (!cart || cart.id !== "anonymous-local-cart" || !cart.items?.length) {
      return
    }
    if (enrichedAnonymousRef.current) return

    const productIds = Array.from(
      new Set(
        cart.items
          .map((i) => i.product_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    )
    if (!productIds.length) return

    listProducts({
      countryCode: locale,
      queryParams: { id: productIds, limit: productIds.length },
    })
      .then(({ response }) => {
        const variantToMax = new Map<string, number>()
        for (const p of response.products ?? []) {
          for (const v of p.variants ?? []) {
            const inv = (v as { inventory_quantity?: number })
              .inventory_quantity
            if (typeof inv === "number" && inv >= 0) {
              variantToMax.set(v.id, inv)
            }
          }
        }
        const currentItems = cart.items ?? []
        const items = currentItems.map((item) => {
          const max = item.variant_id
            ? variantToMax.get(item.variant_id)
            : undefined
          return {
            ...item,
            max_quantity: typeof max === "number" ? max : undefined,
          }
        })
        enrichedAnonymousRef.current = true
        setCart({ ...cart, items })
      })
      .catch(() => {})
  }, [cart?.id, cart?.items, locale])

  // On enter: cap anonymous cart item quantities at inventory (after enrichment)
  useEffect(() => {
    if (!cart || cart.id !== "anonymous-local-cart" || !cart.items?.length) {
      return
    }

    const needsCap = cart.items.filter(
      (i) =>
        typeof (i as { max_quantity?: number }).max_quantity === "number" &&
        (i as { max_quantity?: number }).max_quantity! >= 0 &&
        Number(i.quantity) > (i as { max_quantity?: number }).max_quantity!
    )
    if (!needsCap.length) return

    for (const i of needsCap) {
      updateAnonymousCartItemQuantity(
        i.id,
        (i as { max_quantity?: number }).max_quantity!
      )
    }
    const next = buildAnonymousCartFromLocal()
    enrichedAnonymousRef.current = false
    setCart(next)
  }, [cart?.id, cart?.items])

  const isAnonymousCart = !initialCart || cart?.id === "anonymous-local-cart"

  const refreshCustomerCart = async () => {
    if (!initialCart) {
      return
    }
    const next = await getCustomerCartForClient(locale)
    setCart(next)
  }

  const handleAnonQuantityChange = async (
    lineItemId: string,
    quantity: number
  ) => {
    const item = cart?.items?.find((i) => i.id === lineItemId)
    const max = (item as { max_quantity?: number } | undefined)?.max_quantity
    const capped =
      typeof max === "number" && max >= 0 && quantity > max ? max : quantity
    const next = updateAnonymousCartItemQuantity(lineItemId, capped)
    if (!next) {
      setCart(null)
      return
    }
    const maxById = new Map(
      (cart?.items ?? []).map((i) => [
        i.id,
        (i as { max_quantity?: number }).max_quantity,
      ])
    )
    const itemsWithMax = (next.items ?? []).map((i) => ({
      ...i,
      max_quantity: maxById.get(i.id),
    }))
    setCart({ ...next, items: itemsWithMax })
  }

  const handleAnonDeleteItem = async (lineItemId: string) => {
    const next = deleteAnonymousCartItem(lineItemId)
    setCart(next)
  }

  const handleAnonVariantChange = async (
    lineItemId: string,
    variantId: string,
    quantity: number,
    unitPriceSnapshot?: number | null
  ) => {
    const next = changeAnonymousCartItemVariant({
      lineItemId,
      variantId,
      quantity,
      unitPriceSnapshot,
    })
    setCart(next)
  }

  const handleCustomerQuantityChange = async (
    itemId: string,
    quantity: number
  ) => {
    await updateCustomerCartItem({
      id: itemId,
      quantity,
    })
    await refreshCustomerCart()
  }

  const handleCustomerDeleteItem = async (itemId: string) => {
    await deleteCustomerCartItem(itemId)
    await refreshCustomerCart()
  }

  const handleCustomerVariantChange = async (
    itemId: string,
    variantId: string,
    quantity: number,
    _unitPriceSnapshot?: number | null
  ) => {
    await changeCustomerCartItemVariant({
      itemId,
      variantId,
      quantity,
    })
    await refreshCustomerCart()
  }

  if (!cart) {
    return (
      <div className="container mx-auto py-20 text-center px-4">
        <h1 className="heading-xl mb-4">Your Cart is Empty</h1>
      </div>
    )
  }

  return (
    <CartTemplate
      cart={cart}
      locale={locale}
      onItemQuantityChange={
        isAnonymousCart
          ? handleAnonQuantityChange
          : handleCustomerQuantityChange
      }
      onItemDelete={
        isAnonymousCart ? handleAnonDeleteItem : handleCustomerDeleteItem
      }
      onItemVariantChange={
        isAnonymousCart ? handleAnonVariantChange : handleCustomerVariantChange
      }
    />
  )
}
