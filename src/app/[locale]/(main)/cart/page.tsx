import { CartTemplate } from "@/components/organisms"
import { retrieveCart } from "@/lib/data/cart"
// import { mockCart } from "@/lib/mocks/cart"

export const metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function CartPage() {
  const cart = await retrieveCart()
  // const cart = mockCart

  return <CartTemplate cart={cart} />
}
