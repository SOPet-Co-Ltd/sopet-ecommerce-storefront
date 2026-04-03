"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "../Button/Button"
import { DownArrowIcon, TickHeavyIcon } from "@/icons"

/** Shared padding for content items (label, item, scroll buttons). */
const DROPDOWN_ITEM_PADDING = "px-[14px] py-[10px]"

/** Viewport max height and scroll (native overflow; no Scroll Area to avoid overflow/overflowY conflict). */
const DROPDOWN_VIEWPORT_CLASSES = "max-h-60 overflow-x-hidden overflow-y-auto"

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
  trigger?: React.ReactNode
  width?: number
  alignOffset?: number
  sideOffset?: number
  align?: "center" | "end" | "start" | undefined
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
      trigger,
      width,
      alignOffset,
      sideOffset,
      align,
      ...props
    },
    ref
  ) => {
    const isControlled = openProp !== undefined
    const [openState, setOpenState] = React.useState(defaultOpen ?? false)
    const open = isControlled ? openProp : openState

    const handleOpenChange = React.useCallback(
      (value: boolean) => {
        if (!isControlled) setOpenState(value)
        onOpenChange?.(value)
      },
      [isControlled, onOpenChange]
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
          {trigger ? (
            trigger
          ) : (
            <Button rounded={button?.rounded ?? "rounded"} {...button}>
              <div className="flex justify-between items-center">
                <SelectPrimitive.Value placeholder={placeholder} />
                <SelectPrimitive.Icon className="DropdownIcon">
                  {icon ?? <DownArrowIcon size={16} color="#211F23" />}
                </SelectPrimitive.Icon>
              </div>
            </Button>
          )}
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              "shadow-[0px_4px_6px_-2px_#10182808,0px_12px_16px_-4px_#10182814]",
              "bg-sop-neutral-gray-600 overflow-clip border-sop-neutral-gray-500 rounded-sop-8px",
              width
                ? `w-[${width}px]`
                : "w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width)",
              "DropdownContent",
              contentClassName
            )}
            position="popper"
            alignOffset={alignOffset ?? 0}
            sideOffset={sideOffset ?? 5}
            align={align ?? "end"}
          >
            <SelectPrimitive.Viewport className={DROPDOWN_VIEWPORT_CLASSES}>
              {children}
            </SelectPrimitive.Viewport>
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
