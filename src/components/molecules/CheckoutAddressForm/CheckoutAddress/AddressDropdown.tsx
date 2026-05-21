"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  Controller,
  Control,
  FieldError,
  FieldValues,
  Path,
} from "react-hook-form"

import { InputSOPet } from "@/components/atoms"

import { DownArrowIcon } from "@/icons"
import { normalizeSearch } from "@/lib/data/thai-address-helpers"

export type AddressOption = {
  value: string
  label: string
  searchText: string
  postalCode?: string
}

interface Props<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  title: string
  placeholder: string
  options: AddressOption[]
  disabled?: boolean
  error?: FieldError
  onSelect?: (option: AddressOption) => void
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
}: Props<T>) => {
  const ref = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  const [search, setSearch] = useState("")

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredOptions = useMemo(() => {
    return options.filter((item) =>
      item.searchText.includes(normalizeSearch(search))
    )
  }, [options, search])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        useEffect(() => {
          const selected = options.find(
            (item) => item.value === field.value || item.label === field.value
          )

          if (selected) {
            setSearch(selected.label)
          } else {
            setSearch("")
          }
        }, [field.value, options])

        return (
          <div ref={ref} className="relative">
            <InputSOPet
              isRequire
              title={title}
              placeholder={placeholder}
              value={search}
              disabled={disabled}
              onChange={(e) => {
                setSearch(e.target.value)

                field.onChange("")

                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              size="sm"
              variant="bordered"
              endIcon={<DownArrowIcon size={12} color="#211F23" />}
            />

            {open && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-sop-neutral-grayalpha-200 bg-sop-base-white shadow-lg">
                <div className="max-h-35 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-gray-100"
                      onClick={() => {
                        field.onChange(option.value)

                        setSearch(option.label)

                        onSelect?.(option)

                        setOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In case you use it */}
            {/* {error && (
              <p className="sop-body-xs-regular mt-1 text-sop-system-error-400">
                {error.message}
              </p>
            )} */}
          </div>
        )
      }}
    />
  )
}

export default AddressDropdown
