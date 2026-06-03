import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"

import { HttpTypes } from "@medusajs/types"
import NativeSelect, {
  NativeSelectProps,
} from "@/components/molecules/NativeSelect/NativeSelect"
import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import { toSearchOption } from "@/lib/helpers/searchable-option"
import clsx from "clsx"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
  }
>(({ placeholder = "Country", region, defaultValue, ...props }, ref) => {
  const innerRef = useRef<HTMLSelectElement>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    if (!region) {
      return []
    }

    return (
      region.countries
        ?.filter((country) => country.iso_2 && country.display_name)
        .map((country) =>
          toSearchOption(country.display_name!, country.iso_2!, {
            searchText:
              `${country.display_name} ${country.iso_2}`.toLowerCase(),
          })
        ) ?? []
    )
  }, [region])

  const selectedValue = useMemo(() => {
    const v = props.value
    if (v === undefined) return ""
    if (typeof v === "string") return v
    if (Array.isArray(v)) return v[0] ?? ""
    return String(v)
  }, [props.value])

  const handleSelect = (value: string) => {
    props.onChange?.({
      target: {
        name: props.name,
        value,
      },
    } as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
    <label className="label-md">
      <p className="mb-2">Country</p>
      <SearchableSelect
        placeholder={placeholder}
        value={selectedValue}
        onChange={handleSelect}
        options={countryOptions}
        hideTitle
        isRequire={false}
      />
      <div className="hidden">
        <NativeSelect
          ref={innerRef}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={clsx(
            "hidden w-full h-12 items-center bg-component-secondary"
          )}
          {...props}
        >
          {countryOptions.map(({ value, label }, index) => (
            <option key={index} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </label>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
