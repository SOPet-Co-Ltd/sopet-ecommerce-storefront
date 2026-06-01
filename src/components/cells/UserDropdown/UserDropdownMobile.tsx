"use client"

import { Avatar } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import {
  CloseIcon,
  MenuNavIcon,
  SignInIcon,
  SignOutIcon,
  VetAIIcon,
} from "@/icons"
import { USER_SEGMENT_LABELS } from "@/lib/constants"
import { formatThaiPhoneNumberForDisplay } from "@/lib/helpers/phone"
import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { useId, useState, type ReactNode } from "react"

type DropDownItemProps = {
  icon: ReactNode
  label: string
  onClick?: () => void | Promise<void>
  separator?: boolean
  colored?: boolean
}

const ListItem = ({
  icon,
  label,
  onClick,
  separator,
  colored,
}: DropDownItemProps) => (
  <button
    type="button"
    className={cn(
      "flex items-center gap-3 px-4 py-2.5 w-full",
      colored ? "bg-sop-primary-200" : "bg-transparent",
      separator && "border-b border-sop-neutral-gray-500"
    )}
    onClick={() => void onClick?.()}
  >
    {icon}
    <p className="sop-body-sm-regular">{label}</p>
  </button>
)

const getNavigationItems = () => {
  const separatorItems = ["favorites", "help", "delete"]
  const coloredItems = ["profile"]
  return Object.entries(USER_SEGMENT_LABELS).map(([segment, config]) => {
    return {
      segment,
      label: config?.label ?? segment,
      Icon: config?.icon,
      href: `/user/${segment}` as const,
      separator: separatorItems.includes(segment),
      colored: coloredItems.includes(segment),
    }
  })
}

export const UserDropdownMobile = ({
  user,
}: {
  user: HttpTypes.StoreCustomer | null
}) => {
  const metadata = (user?.metadata ?? null) as Record<string, unknown> | null
  const displayName =
    (user &&
      ([user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email ||
        formatThaiPhoneNumberForDisplay(user.phone) ||
        "")) ||
    ""
  const avatarUrl = metadata?.avatar_url as string | undefined
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : "th"
  const navigationItems = getNavigationItems()

  return (
    <>
      <div className="flex justify-center items-center">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(true)}
        >
          <MenuNavIcon size={16} color="#454547" />
        </button>
      </div>
      {/* Overlay + panel always mounted so we can animate close; visibility/pointer-events toggled by open */}
      <div
        role="presentation"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-10 bg-black/20 transition-opacity duration-200 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      >
        <section
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="User menu"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-0 right-0 w-[75%] h-full bg-sop-base-white z-10",
            "transition duration-200 ease-out",
            open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 pointer-events-none"
          )}
        >
          <div className="flex justify-end items-end h-[92px] px-[17px] py-[21px]">
            <button
              type="button"
              className="bg-sop-primary-500 rounded-xl p-sop-8px"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <CloseIcon size={16} color="#fff" />
            </button>
          </div>
          <div className="flex flex-col">
            {!user ? (
              <>
                <ListItem
                  icon={<VetAIIcon size={14} color="#454547" />}
                  label={"Vet AI"}
                  colored
                  separator
                />
                <ListItem
                  icon={<SignInIcon size={14} color="#454547" />}
                  label={"เข้าสู่ระบบ"}
                  colored
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-sop-16px px-4 mb-5 h-sop-56px">
                  <Avatar
                    src={avatarUrl}
                    size="small"
                    className="h-sop-28px w-sop-28px"
                    alt={displayName || "User avatar"}
                  />
                  <span className="sop-body-sm-regular">
                    {displayName.split(" ")[0]}
                  </span>
                </div>
                {navigationItems.map(
                  ({ segment, label, href, Icon, separator, colored }) => (
                    <LocalizedClientLink
                      key={segment}
                      href={href}
                      onClick={() => setOpen(false)}
                    >
                      {Icon && (
                        <ListItem
                          icon={<Icon size={14} color="#454547" />}
                          label={label}
                          separator={separator}
                          colored={colored}
                        />
                      )}
                    </LocalizedClientLink>
                  )
                )}
                <ListItem
                  icon={<SignOutIcon size={14} color="#454547" />}
                  label="ออกจากระบบ"
                  separator
                  onClick={() => {
                    setOpen(false)
                    window.location.assign(`/${locale}/signout`)
                  }}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
