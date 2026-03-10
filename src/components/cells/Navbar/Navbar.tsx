import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, NavbarSearch } from "@/components/molecules"
import {
  SOPetLogo,
  UserManagementBellIcon,
  UserManagementShoppingBagIcon,
  UserManagementUserIcon,
} from "@/icons"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { UserDropdown } from "../UserDropdown/UserDropdown"

export const Navbar = ({
  categories,
  user,
}: {
  categories: HttpTypes.StoreProductCategory[]
  user: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="bg-sop-neutral-whitealpha-700 flex items-center justify-between md:px-20 px-4 md:py-3 py-2">
      <div className="flex justify-start items-center md:gap-6 gap-2 w-full">
        <LocalizedClientLink href="/">
          <SOPetLogo size={45} />
        </LocalizedClientLink>
        <NavbarSearch />
        {/* TODO - Refactor to use a button component for minimal use client side routing */}
        {/* TODO - route to vet ai page */}
        <LocalizedClientLink href="/vet-ai">
          <p className="hidden md:block sop-body-md-regular text-sop-neutral-gray-300">
            Vet AI
          </p>
        </LocalizedClientLink>
        {/* <LocalizedClientLink href="/user/messages"> */}
        <p>
          <UserManagementBellIcon size={18} color="#454547" />
        </p>
        {/* </LocalizedClientLink> */}
        <LocalizedClientLink href="/cart">
          <p>
            <UserManagementShoppingBagIcon size={18} color="#454547" />
          </p>
        </LocalizedClientLink>

        <div className="hidden md:block">
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <LocalizedClientLink href="/login">
              <Button className="hidden md:block" size="md" variant="primary">
                เข้าสู่ระบบ
              </Button>
            </LocalizedClientLink>
          )}
        </div>
      </div>
    </div>
  )
}
