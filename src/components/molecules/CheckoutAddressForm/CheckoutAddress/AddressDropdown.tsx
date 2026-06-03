"use client"

import type { Control, FieldError, FieldValues, Path } from "react-hook-form"

import type {
  DropdownAlign,
  DropdownWidthMode,
} from "@/components/molecules/SearchableSelect/SearchableSelect"
import { SearchableSelectField } from "@/components/molecules/SearchableSelect/SearchableSelectField"
import type { SearchableOption } from "@/components/molecules/SearchableSelect/types"

export type AddressOption = SearchableOption

interface Props<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  title: string
  placeholder: string
  options: AddressOption[]
  disabled?: boolean
  error?: FieldError
  onSelect?: (option: AddressOption) => void
  searchable?: boolean
  showAllOptions?: boolean
  dropdownWidth?: DropdownWidthMode
  fixedDropdownWidth?: number | string
  dropdownAlign?: DropdownAlign
  dropdownClassName?: string
}

const AddressDropdown = <T extends FieldValues>({
  control,
  name,
  title,
  placeholder,
  options,
  disabled,
  error,
  onSelect,
  searchable,
  showAllOptions,
  dropdownWidth,
  fixedDropdownWidth,
  dropdownAlign,
  dropdownClassName,
}: Props<T>) => (
  <SearchableSelectField
    control={control}
    name={name}
    title={title}
    placeholder={placeholder}
    options={options}
    disabled={disabled}
    error={error}
    onSelect={onSelect}
    searchable={searchable}
    showAllOptions={showAllOptions}
    dropdownWidth={dropdownWidth}
    fixedDropdownWidth={fixedDropdownWidth}
    dropdownAlign={dropdownAlign}
    dropdownClassName={dropdownClassName}
  />
)

export default AddressDropdown
