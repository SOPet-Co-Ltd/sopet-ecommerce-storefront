import { normalizeSearch } from "@/lib/data/thai-address-helpers"

import type { SearchableOption } from "@/components/molecules/SearchableSelect/types"

export function toSearchOption(
  label: string,
  value?: string,
  extra?: Partial<Omit<SearchableOption, "value" | "label" | "searchText">> & {
    searchText?: string
  }
): SearchableOption {
  const resolvedValue = value ?? label
  return {
    value: resolvedValue,
    label,
    searchText: extra?.searchText ?? normalizeSearch(label),
    ...extra,
  }
}

export function getOptionSearchText(option: SearchableOption): string {
  return option.searchText ?? normalizeSearch(option.label)
}
