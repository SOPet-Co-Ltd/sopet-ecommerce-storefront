import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar, NavbarSearch } from "@/components/molecules"
import {
  ClipboardAddIcon,
  LinkIcon,
  SaleIcon,
  ShieldCheckIcon,
  SOPetLogo,
  UserManagementBellIcon,
  UserManagementUserIcon,
} from "@/icons"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { UserDropdown } from "../UserDropdown/UserDropdown"
import { UserDropdownMobile } from "../UserDropdown/UserDropdownMobile"
import { NavbarCartButton } from "./NavbarCartButton"

export const Navbar = ({ user }: { user: HttpTypes.StoreCustomer | null }) => {
  return (
    <section>
      <div className="sop-gradient-01 px-sop-4px md:px-sop-48px py-sop-4px flex md:justify-end justify-between items-center md:gap-3 h-10">
        <div className="flex gap-0.5 md:gap-2 rounded-full items-center bg-sop-neutral-whitealpha-100">
          <div className="bg-sop-primary-100 rounded-full aspect-square flex justify-center items-center p-1.5">
            <SaleIcon size={10} color="#9C6ADE" />
          </div>
          <p className="sop-body-2xs-regular md:sop-body-xs-regular text-sop-base-white pr-1.5">
            ส่วนลดพิเศษ
          </p>
        </div>
        <div className="flex gap-0.5 md:gap-2 rounded-full items-center bg-sop-neutral-whitealpha-100">
          <div className="bg-sop-primary-100 rounded-full aspect-square flex justify-center items-center p-1.5">
            <ClipboardAddIcon size={10} color="#9C6ADE" />
          </div>
          <p className="sop-body-2xs-regular md:sop-body-xs-regular text-sop-base-white pr-1.5">
            ปรึกษาทุกปัญหา
          </p>
        </div>
        <div className="flex gap-0.5 md:gap-2 rounded-full items-center bg-sop-neutral-whitealpha-100">
          <div className="bg-sop-primary-100 rounded-full aspect-square flex justify-center items-center p-1.5">
            <LinkIcon size={10} color="#9C6ADE" />
          </div>
          <p className="sop-body-2xs-regular md:sop-body-xs-regular text-sop-base-white pr-1.5">
            สัตวแพทย์แนะนำ
          </p>
        </div>
        <div className="flex gap-0.5 md:gap-2 rounded-full items-center bg-sop-neutral-whitealpha-100">
          <div className="bg-sop-primary-100 rounded-full aspect-square flex justify-center items-center p-1.5">
            <ShieldCheckIcon size={10} color="#9C6ADE" />
          </div>
          <p className="sop-body-2xs-regular md:sop-body-xs-regular text-sop-base-white pr-1.5">
            ของแท้ 100%
          </p>
        </div>
      </div>
      <div className="bg-sop-neutral-whitealpha-700 flex items-center justify-between md:px-20 px-4 md:py-3 py-2">
        <div className="flex justify-start items-center md:gap-6 gap-2 w-full">
          <LocalizedClientLink href="/" aria-label="SOPet หน้าหลัก">
            <SOPetLogo size={45} aria-hidden="true" />
          </LocalizedClientLink>
          <NavbarSearch />
          {/* TODO - Refactor to use a button component for minimal use client side routing */}
          {/* TODO - route to vet ai page */}
          <LocalizedClientLink href="/vet-ai">
            <p className="hidden md:block sop-body-md-regular text-sop-neutral-gray-300">
              Vet AI
            </p>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/user/notifications"
            aria-label="การแจ้งเตือน"
          >
            <p>
              <UserManagementBellIcon
                size={18}
                color="#454547"
                aria-hidden="true"
              />
            </p>
          </LocalizedClientLink>
          <NavbarCartButton hasUser={Boolean(user)} />

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
          <div className="block md:hidden">
            <UserDropdownMobile user={user} />
          </div>
        </div>
      </div>
    </section>
  )
}
