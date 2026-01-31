"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "../Button/Button"
import { DownArrowIcon, TickHeavyIcon, UpArrowIcon } from "@/icons"

/** Shared padding for content items (label, item, scroll buttons). */
const DROPDOWN_ITEM_PADDING = "px-[14px] py-[10px]"

/** Content panel base styles. */
const DROPDOWN_CONTENT_CLASSES =
  "bg-sop-neutral-gray-600 overflow-clip border-sop-neutral-gray-500 rounded-sop-8px w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width)"

/** Close animation duration (ms) — keep in sync with globals.css dropdownClose */
const DROPDOWN_CLOSE_DURATION_MS = 180

/**
 * Radix Select-based dropdown.
 *
 * Use `DropdownItem` (and optionally `DropdownGroup`, `DropdownLabel`, `DropdownSeparator`).
 * Style via: DropdownTrigger, DropdownContent, DropdownViewport, DropdownScrollButton,
 * DropdownIcon, DropdownItem, DropdownItemIndicator, DropdownLabel, DropdownSeparator.
 *
 * @see https://www.radix-ui.com/primitives/docs/components/select
 */

export interface DropdownProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Root
> {
  placeholder?: React.ReactNode
  triggerClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  button?: Omit<ButtonProps, "children">
}

export const Dropdown = React.forwardRef<HTMLButtonElement, DropdownProps>(
  (
    {
      children,
      placeholder,
      triggerClassName,
      contentClassName,
      icon,
      button,
      open: openProp,
      defaultOpen,
      onOpenChange,
      ...props
    },
    ref
  ) => {
    const isControlled = openProp !== undefined
    const [openState, setOpenState] = React.useState(defaultOpen ?? false)
    const open = isControlled ? openProp : openState
    const [isClosing, setIsClosing] = React.useState(false)
    const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

    const handleOpenChange = React.useCallback(
      (value: boolean) => {
        if (value === false) {
          setIsClosing(true)
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = setTimeout(() => {
            closeTimeoutRef.current = null
            if (!isControlled) setOpenState(false)
            onOpenChange?.(false)
            setIsClosing(false)
          }, DROPDOWN_CLOSE_DURATION_MS)
        } else {
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
          }
          setIsClosing(false)
          if (!isControlled) setOpenState(true)
          onOpenChange?.(true)
        }
      },
      [isControlled, onOpenChange]
    )

    React.useEffect(
      () => () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      },
      []
    )

    return (
      <SelectPrimitive.Root
        {...props}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn("DropdownTrigger", triggerClassName)}
          asChild
        >
          <Button rounded={button?.rounded ?? "rounded"} {...button}>
            <div className="flex justify-between items-center">
              <SelectPrimitive.Value placeholder={placeholder} />
              <SelectPrimitive.Icon className="DropdownIcon">
                {icon ?? <DownArrowIcon size={16} color="#211F23" />}
              </SelectPrimitive.Icon>
            </div>
          </Button>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              DROPDOWN_CONTENT_CLASSES,
              "DropdownContent",
              isClosing && "DropdownContent--closing",
              contentClassName
            )}
            position="popper"
            alignOffset={0}
            sideOffset={5}
          >
            <SelectPrimitive.ScrollUpButton
              className={cn(
                "flex justify-center items-center",
                DROPDOWN_ITEM_PADDING
              )}
            >
              <UpArrowIcon size={16} />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton
              className={cn(
                "flex justify-center items-center",
                DROPDOWN_ITEM_PADDING
              )}
            >
              <DownArrowIcon size={16} />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  }
)

Dropdown.displayName = "Dropdown"

// --- Item ---

export type DropdownItemProps = SelectPrimitive.SelectItemProps & {
  className?: string
}

const itemClasses = cn(
  "flex justify-between items-center bg-transparent data-[state=checked]:bg-sop-neutral-gray-500",
  DROPDOWN_ITEM_PADDING
)

export const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ children, className, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(itemClasses, className)}
      {...props}
    >
      <SelectPrimitive.ItemText className="text-sop-neutral-gray-200 sop-body-md-regular">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="DropdownItemIndicator">
        <TickHeavyIcon size={12} color="#9C6ADE" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
)

DropdownItem.displayName = "DropdownItem"

// --- Label ---

export type DropdownLabelProps = SelectPrimitive.SelectLabelProps & {
  className?: string
}

const labelClasses = cn(
  DROPDOWN_ITEM_PADDING,
  "sop-body-sm-medium text-sop-neutral-gray-400 cursor-default select-none"
)

export const DropdownLabel = React.forwardRef<
  HTMLDivElement,
  DropdownLabelProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(labelClasses, className)}
    {...props}
  />
))

DropdownLabel.displayName = "DropdownLabel"

// --- Separator ---

export type DropdownSeparatorProps = SelectPrimitive.SelectSeparatorProps & {
  className?: string
}

export const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownSeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-sop-neutral-gray-500 shrink-0", className)}
    {...props}
  />
))

DropdownSeparator.displayName = "DropdownSeparator"

// --- Group ---

export const DropdownGroup = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectGroupProps
>(({ children, className, ...props }, ref) => (
  <SelectPrimitive.Group ref={ref} className={cn(className)} {...props}>
    {children}
  </SelectPrimitive.Group>
))

DropdownGroup.displayName = "DropdownGroup"
