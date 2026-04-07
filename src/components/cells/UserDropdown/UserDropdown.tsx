"use client"

import { Avatar, Button, Dropdown } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { DownArrowIcon, LogoutIcon, SignOutIcon } from "@/icons"
import { USER_SEGMENT_LABELS } from "@/lib/constants"
import { signout } from "@/lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useState, type ReactNode } from "react"

type DropDownItemProps = {
  icon: ReactNode
  label: string
  onClick?: () => void | Promise<void>
  as?: "button" | "div"
}

const DropDownItem = ({
  icon,
  label,
  onClick,
  as = "div",
}: DropDownItemProps) => {
  const className =
    "flex w-full cursor-pointer items-center gap-sop-12px px-sop-16px py-2.5"

  if (as === "button") {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          void onClick?.()
        }}
      >
        {icon}
        <p className="sop-body-sm-regular">{label}</p>
      </button>
    )
  }

  return (
    <div className={className}>
      {icon}
      <p className="sop-body-sm-regular">{label}</p>
    </div>
  )
}

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

export const UserDropdown = ({
  user,
}: {
  user: HttpTypes.StoreCustomer | null
}) => {
  const metadata = (user?.metadata ?? null) as Record<string, unknown> | null
  const displayName =
    (user &&
      ([user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email ||
        user.phone ||
        "")) ||
    ""
  const avatarUrl = metadata?.avatar_url as string | undefined
  const [open, setOpen] = useState(false)

  const navigationItems = getNavigationItems()

  return user ? (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      align="end"
      width={240}
      trigger={
        <div className="flex cursor-pointer items-center gap-sop-8px">
          <Avatar
            src={avatarUrl}
            size="xsmall"
            className="h-sop-28px w-sop-28px"
            alt={displayName || "User avatar"}
          />
          <span className="sop-body-md-regular hidden max-w-[120px] truncate text-sop-neutral-gray-300 md:inline-flex">
            {displayName.split(" ")[0]}
          </span>
          <DownArrowIcon size={16} color="#454547" />
        </div>
      }
    >
      <div className="flex w-[240px] flex-col">
        {navigationItems.map(({ segment, label, href, Icon }) => (
          <LocalizedClientLink
            key={segment}
            href={href}
            onClick={() => setOpen(false)}
          >
            {Icon && (
              <DropDownItem
                icon={<Icon size={14} color="#454547" />}
                label={label}
              />
            )}
          </LocalizedClientLink>
        ))}
        <DropDownItem
          icon={<SignOutIcon size={14} color="#454547" />}
          label="ออกจากระบบ"
          as="button"
          onClick={async () => {
            await signout()
            setOpen(false)
          }}
        />
      </div>
    </Dropdown>
  ) : (
    <LocalizedClientLink href="/login">
      <Button className="hidden md:block" size="md" variant="primary">
        เข้าสู่ระบบ
      </Button>
    </LocalizedClientLink>
  )
}
