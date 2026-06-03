"use client"

import { useEffect, useMemo, useState } from "react"

import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import { toSearchOption } from "@/lib/helpers/searchable-option"

/**
 * @deprecated Use SearchableSelect or SearchableSelectField instead.
 */
export const SelectField = ({
  options,
  className = "",
  selected,
  selectOption,
  placeholder = "",
}: {
  options: {
    value?: string
    label?: string
    hidden?: boolean
  }[]
  placeholder?: string
  className?: string
  selected?: string | number | readonly string[]
  selectOption?: (value: string) => void
}) => {
  const searchableOptions = useMemo(
    () =>
      options
        .filter(({ hidden, value }) => !hidden && value)
        .map(({ label, value }) => toSearchOption(label ?? value ?? "", value)),
    [options]
  )

  const resolvedSelected = useMemo(() => {
    if (selected === undefined) return ""
    if (Array.isArray(selected)) return selected[0] ?? ""
    return String(selected)
  }, [selected])

  const [value, setValue] = useState(resolvedSelected)

  useEffect(() => {
    setValue(resolvedSelected)
  }, [resolvedSelected])

  return (
    <SearchableSelect
      value={value}
      onChange={(next) => {
        setValue(next)
        if (selectOption && next) selectOption(next)
      }}
      options={searchableOptions}
      placeholder={placeholder}
      hideTitle
      isRequire={false}
      className={className}
    />
  )
}
