import { CartTemplate } from "@/components/organisms"
import { restoreHiddenItems, retrieveCart } from "@/lib/data/cart"
import { Cart } from "@/types/cart"
import { redirect } from "next/navigation"
// import { mockCart } from "@/lib/mocks/cart"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function CartPage() {
  const restored = await restoreHiddenItems()

  if (restored) {
    redirect("/cart")
  }

  const cart = await retrieveCart()

  return <CartTemplate cart={cart as Cart} />
}
