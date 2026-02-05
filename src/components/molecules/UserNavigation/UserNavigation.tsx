"use client"

import type { HttpTypes } from "@medusajs/types"
import { USER_SEGMENT_LABELS } from "@/lib/constants"
import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import {
  Avatar,
  Dropdown,
  DropdownGroup,
  DropdownItem,
} from "@/components/atoms"
import { DownArrowIcon } from "@/icons"

const getNavigationItems = () => {
  return Object.entries(USER_SEGMENT_LABELS).map(([segment, config]) => {
    return {
      segment,
      label: config?.label ?? segment,
      Icon: config?.icon,
      href: `/user/${segment}` as const,
    }
  })
}

type UserNavigationProps = {
  user?: HttpTypes.StoreCustomer | null
}

export const UserNavigation = ({ user }: UserNavigationProps) => {
  const pathname = usePathname()
  const { locale } = useParams()
  const localeStr = String(locale ?? "")
  const pathWithoutLocale =
    localeStr.length > 0
      ? pathname.replace(new RegExp(`^/${localeStr}`), "") || "/"
      : pathname || "/"
  const navigationItems = getNavigationItems()
  const matchedItem = navigationItems.find(
    (item) => item.href === pathWithoutLocale
  )
  const dropdownValue = matchedItem ? matchedItem.href : ""
  const avatarUrl = (user as { metadata?: { avatar_url?: string } } | undefined)
    ?.metadata?.avatar_url
  return (
    <>
      <div className="lg:hidden block">
        <Dropdown
          value={dropdownValue}
          placeholder="บัญชีของฉัน"
          button={{ variant: "neutral", size: "md", fill: true }}
          icon={<DownArrowIcon size={16} color="#211F23" />}
        >
          <DropdownGroup>
            {navigationItems.map(({ segment, label, href }) => (
              <LocalizedClientLink key={segment} href={href}>
                <DropdownItem value={href}>{label}</DropdownItem>
              </LocalizedClientLink>
            ))}
          </DropdownGroup>
        </Dropdown>
      </div>
      <div
        className={cn("bg-sop-base-white rounded-sop-8px", "lg:block hidden")}
      >
        <div
          className={cn(
            "px-sop-16px py-sop-12px flex items-center gap-sop-16px"
          )}
        >
          <Avatar size="small" src={avatarUrl} />
          <span className="sop-body-sm-regular text-sop-neutral-gray-200">
            บัญชีของฉัน
          </span>
        </div>
        <div className="h-px bg-sop-neutral-gray-500" />
        {navigationItems.map(({ segment, label, href, Icon }) => (
          <LocalizedClientLink key={segment} href={href}>
            <div className={cn("px-sop-16px py-[10px]")}>
              <span className="flex items-center gap-sop-12px">
                {Icon && <Icon size={16} color="#454547" />}
                <span
                  className={cn(
                    "sop-body-md-regular text-sop-neutral-gray-200",
                    pathWithoutLocale === href && "text-sop-primary-500"
                  )}
                >
                  {label}
                </span>
              </span>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </>
  )
}
