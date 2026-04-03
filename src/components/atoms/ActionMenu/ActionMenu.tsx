"use client"

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
  Portal,
} from "@headlessui/react"
import { Fragment } from "react"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionMenuProps {
  className?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export const ActionMenu = ({ className, children, icon }: ActionMenuProps) => {
  return (
    <div className={cn("relative text-right", className)}>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <MenuButton className="inline-flex w-full justify-center rounded-full p-2 text-sm font-medium focus:outline-none">
            {icon || (
              <MoreVertical
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            )}
          </MenuButton>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Portal>
            <MenuItems
              anchor="bottom end"
              className="mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg focus:outline-none z-50 flex flex-col p-1 border border-gray-100"
            >
              {children}
            </MenuItems>
          </Portal>
        </Transition>
      </Menu>
    </div>
  )
}

export const ActionMenuItem = ({
  onClick,
  children,
  className,
  disabled,
}: {
  onClick?: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) => {
  return (
    <MenuItem {...(typeof disabled === "boolean" ? { disabled } : {})}>
      {({ /* active, */ focus, disabled }) => (
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "group flex w-full items-center rounded-md px-2 py-2 text-sm text-left",
            focus ? "bg-sop-primary-50 text-sop-primary-500" : "text-gray-900",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            className
          )}
        >
          {children}
        </button>
      )}
    </MenuItem>
  )
}
