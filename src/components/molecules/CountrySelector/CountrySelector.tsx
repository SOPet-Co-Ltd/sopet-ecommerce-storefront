"use client"

import { useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"

import { useParams, usePathname, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { updateRegionWithValidation } from "@/lib/data/cart"
import { Label } from "@medusajs/ui"
import { toast } from "@/lib/helpers/toast"
import { SearchableSelect } from "@/components/molecules/SearchableSelect/SearchableSelect"
import { normalizeSearch } from "@/lib/data/thai-address-helpers"
import type { SearchableOption } from "@/components/molecules/SearchableSelect/types"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  regions: HttpTypes.StoreRegion[]
}

const CountrySelect = ({ regions }: CountrySelectProps) => {
  const [current, setCurrent] = useState<CountryOption | undefined>(undefined)

  const { locale: countryCode } = useParams()
  const router = useRouter()
  const currentPath = usePathname().split(`/${countryCode}`)[1]

  const options = useMemo<CountryOption[] | undefined>(() => {
    const list = regions
      ?.map((r) =>
        r.countries?.map((c) =>
          c?.iso_2 && c?.display_name
            ? { country: c.iso_2, region: r.id, label: c.display_name }
            : undefined
        )
      )
      .flat()
      .filter((o): o is CountryOption => !!o && !!o.country && !!o.label)
      .sort((a, b) => a.label.localeCompare(b.label))

    return list
  }, [regions])

  const searchableOptions = useMemo<SearchableOption[]>(
    () =>
      options?.map((o) => ({
        value: o.country,
        label: o.country.toUpperCase(),
        searchText: normalizeSearch(`${o.label} ${o.country}`),
        country: o.country,
        region: o.region,
        displayLabel: o.label,
      })) ?? [],
    [options]
  )

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  const handleChange = async (option: CountryOption) => {
    try {
      const result = await updateRegionWithValidation(
        option.country,
        currentPath
      )

      if (result.removedItems.length > 0) {
        const itemsList = result.removedItems.join(", ")
        toast.info({
          title: "Cart updated",
          description: `${itemsList} ${result.removedItems.length === 1 ? "is" : "are"} not available in ${option.label} and ${result.removedItems.length === 1 ? "was" : "were"} removed from your cart.`,
        })
      }

      router.push(result.newPath)
      router.refresh()
    } catch (error: any) {
      toast.error({
        title: "Error switching region",
        description:
          error?.message || "Failed to update region. Please try again.",
      })
    }
  }

  const renderCountryOption = (option: SearchableOption) => (
    <span className="flex items-center gap-x-2 pl-2">
      <ReactCountryFlag
        svg
        style={{
          width: "16px",
          height: "16px",
        }}
        countryCode={String(option.country ?? option.value)}
      />
      {String(option.label)}
    </span>
  )

  return (
    <div className="md:flex gap-2 items-center justify-end relative">
      <Label className="label-md hidden md:block">Shipping to</Label>
      <div className="w-16">
        <SearchableSelect
          value={current?.country ?? String(countryCode ?? "")}
          onChange={(country) => {
            const option = options?.find((o) => o.country === country)
            if (option) {
              setCurrent(option)
              void handleChange(option)
            }
          }}
          options={searchableOptions}
          placeholder={current?.country.toUpperCase() ?? "TH"}
          hideTitle
          isRequire={false}
          className="w-16"
          renderOption={renderCountryOption}
          dropdownWidth="content"
        />
      </div>
    </div>
  )
}

export default CountrySelect
