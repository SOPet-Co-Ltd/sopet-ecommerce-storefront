import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, NavbarSearch } from "@/components/molecules"
import { SOPetLogo } from "@/icons"

export const Navbar = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  return (
    <div className="bg-sop-neutral-whitealpha-700 flex items-center justify-between md:px-20 px-4 md:py-3 py-2">
      <div className="flex justify-start items-center gap-6 w-full">
        <SOPetLogo size={45} />
        <NavbarSearch />
      </div>
      <div>
        {/* TODO - Add more navbar content */}
        {/* <div className="hidden md:flex items-center">
          <CategoryNavbar categories={categories} />
        </div> */}
      </div>
    </div>
  )
}
