"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Input as InputSOPet } from "@/components/atoms/InputSOPet/Input"
import { DownArrowIcon } from "@/icons"
import { normalizeSearch } from "@/lib/data/thai-address-helpers"
import { getOptionSearchText } from "@/lib/helpers/searchable-option"
import { cn } from "@/lib/utils"

import {
  getDropdownPanelClassName,
  getDropdownPanelStyle,
  type DropdownAlign,
  type DropdownWidthMode,
} from "./getDropdownPanelClassName"
import type { SearchableOption } from "./types"

export type { DropdownAlign, DropdownWidthMode }

function getSearchDisplayFromValue(
  value: string,
  options: SearchableOption[],
  getDisplayLabel?: (value: string, options: SearchableOption[]) => string
): string {
  if (!value) return ""

  const selected = options.find(
    (item) => item.value === value || item.label === value
  )
  if (selected) return selected.label

  if (getDisplayLabel) return getDisplayLabel(value, options)

  return value
}

export type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  title?: string
  placeholder: string
  disabled?: boolean
  error?: { message?: string }
  onSelect?: (option: SearchableOption) => void
  isRequire?: boolean
  getDisplayLabel?: (value: string, options: SearchableOption[]) => string
  renderOption?: (option: SearchableOption) => React.ReactNode
  emptyText?: string
  className?: string
  hideTitle?: boolean
  /** When "label", form state stores option.label instead of option.value */
  storeFieldValue?: "value" | "label"
  /** When false, input is read-only and the list is not filtered by typing (default: true) */
  searchable?: boolean
  /** When true, opening the panel lists every option; typing filters the list */
  showAllOptions?: boolean
  /**
   * Panel width mode. Default `trigger` — options list matches the input width.
   * Use `content` / `viewport` (wide with screen margin) / `fixed` when you need a non-trigger panel.
   */
  dropdownWidth?: DropdownWidthMode
  /** Width when dropdownWidth is "fixed" (e.g. 280 or "18rem") */
  fixedDropdownWidth?: number | string
  /** Snap panel to trigger edge; default `start` = left-aligned with input */
  dropdownAlign?: DropdownAlign
  dropdownClassName?: string
}

export const SearchableSelect = ({
  value,
  onChange,
  options,
  title,
  placeholder,
  disabled,
  error,
  onSelect,
  isRequire = true,
  getDisplayLabel,
  renderOption,
  emptyText = "ไม่พบข้อมูล",
  className,
  hideTitle = false,
  storeFieldValue = "value",
  searchable = true,
  showAllOptions = false,
  dropdownWidth = "trigger",
  fixedDropdownWidth,
  dropdownAlign = "start",
  dropdownClassName,
}: SearchableSelectProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(() =>
    getSearchDisplayFromValue(value, options, getDisplayLabel)
  )
  const [filterBySearch, setFilterBySearch] = useState(false)
  const [triggerWidthPx, setTriggerWidthPx] = useState<number | undefined>()

  const closePanel = useCallback(() => {
    setOpen(false)
    if (showAllOptions) setFilterBySearch(false)
  }, [showAllOptions])

  const panelClassName = useMemo(
    () =>
      getDropdownPanelClassName(
        dropdownWidth,
        dropdownAlign,
        dropdownClassName
      ),
    [dropdownWidth, dropdownAlign, dropdownClassName]
  )

  const panelStyle = useMemo(
    () =>
      getDropdownPanelStyle(dropdownWidth, {
        fixedDropdownWidth,
        triggerWidthPx:
          dropdownWidth === "trigger" ? triggerWidthPx : undefined,
      }),
    [dropdownWidth, fixedDropdownWidth, triggerWidthPx]
  )

  const syncTriggerWidth = useCallback(() => {
    if (!ref.current) return
    setTriggerWidthPx(ref.current.offsetWidth)
  }, [])

  useEffect(() => {
    if (dropdownWidth !== "trigger") return

    syncTriggerWidth()

    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(syncTriggerWidth)
    observer.observe(el)
    return () => observer.disconnect()
  }, [dropdownWidth, className, syncTriggerWidth])

  useEffect(() => {
    if (open && dropdownWidth === "trigger") {
      syncTriggerWidth()
    }
  }, [open, dropdownWidth, syncTriggerWidth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        closePanel()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [closePanel])

  useEffect(() => {
    // Typing to filter calls onChange(""); do not wipe the query while open
    if (searchable && open) return

    setSearch(getSearchDisplayFromValue(value, options, getDisplayLabel))
  }, [value, options, getDisplayLabel, searchable, open])

  const filteredOptions = useMemo(() => {
    if (!searchable) return options

    const query = normalizeSearch(search)

    if (showAllOptions && (!filterBySearch || !query)) return options

    if (!query) return options

    return options.filter((item) => getOptionSearchText(item).includes(query))
  }, [options, search, searchable, showAllOptions, filterBySearch])

  const optionKey = (option: SearchableOption, index: number) =>
    `${option.value}-${String(option.postalCode ?? "")}-${index}`

  return (
    <div ref={ref} className={cn("relative", className)}>
      <InputSOPet
        isRequire={isRequire}
        title={hideTitle ? undefined : title}
        placeholder={placeholder}
        value={search}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus={false}
        spellCheck={false}
        autoSave="off"
        disabled={disabled}
        readOnly={!searchable}
        state={error ? "error" : "default"}
        className={!searchable ? "cursor-pointer" : undefined}
        onChange={(e) => {
          if (!searchable) return
          setSearch(e.target.value)
          onChange("")
          setOpen(true)
          if (showAllOptions) setFilterBySearch(true)
        }}
        onClick={() => {
          if (!searchable && !disabled) {
            setOpen((prev) => !prev)
          }
        }}
        onFocus={() => {
          setOpen(true)
          if (showAllOptions) setFilterBySearch(false)
        }}
        size="sm"
        variant="bordered"
        endIcon={<DownArrowIcon size={12} color="#211F23" />}
      />

      {open && (
        <div className={panelClassName} style={panelStyle}>
          <div className="max-h-35 w-full min-w-0 overflow-x-hidden overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="sop-body-sm-regular px-4 py-3 text-sop-neutral-gray-300">
                {emptyText}
              </p>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={optionKey(option, index)}
                  type="button"
                  className="box-border flex w-full min-w-0 max-w-full px-4 py-3 text-left hover:bg-gray-100"
                  onClick={() => {
                    onChange(
                      storeFieldValue === "label" ? option.label : option.value
                    )
                    setSearch(option.label)
                    onSelect?.(option)
                    closePanel()
                  }}
                >
                  <span
                    className={
                      dropdownWidth === "trigger"
                        ? `block min-w-0 w-full overflow-hidden${renderOption ? "" : " truncate"}`
                        : renderOption
                          ? "block min-w-0 w-full"
                          : "block min-w-0 w-full truncate"
                    }
                  >
                    {renderOption ? renderOption(option) : option.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error?.message && (
        <p className="sop-body-xs-regular mt-1 text-sop-system-error-400">
          {error.message}
        </p>
      )}
    </div>
  )
}
