import { Cart } from "@/types/cart"
import { getCartForCustomerCartPage } from "@/lib/data/customer-cart-page"
import { CartPageClient } from "./CartPageClient"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const cart = await getCartForCustomerCartPage(locale)

  return <CartPageClient initialCart={cart as Cart | null} locale={locale} />
}
