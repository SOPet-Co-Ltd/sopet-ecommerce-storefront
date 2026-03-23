import { HttpTypes } from "@medusajs/types"

import { listCategories } from "@/lib/data/categories"
import { PARENT_CATEGORIES } from "@/const"
import { verifyCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import { Navbar } from "@/components/cells"

export const Header = async () => {
  const user = await verifyCustomer()
  let wishlist: Wishlist[] = []
  if (user) {
    const response = await getUserWishlists()
    wishlist = response.wishlists
  }
  const { categories } = (await listCategories({
    headingCategories: PARENT_CATEGORIES,
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }

  return (
    <header>
      <Navbar categories={categories} user={user} />
    </header>
  )
}
