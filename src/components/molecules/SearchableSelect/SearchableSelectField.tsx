"use client"

import {
  Controller,
  type Control,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form"

import {
  SearchableSelect,
  type SearchableSelectProps,
} from "./SearchableSelect"
import type { SearchableOption } from "./types"

type SearchableSelectFieldProps<T extends FieldValues> = Omit<
  SearchableSelectProps,
  "value" | "onChange"
> & {
  control: Control<T>
  name: Path<T>
  error?: FieldError
}

export const SearchableSelectField = <T extends FieldValues>({
  control,
  name,
  error,
  ...selectProps
}: SearchableSelectFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SearchableSelect
          {...selectProps}
          value={field.value ?? ""}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  )
}

export type { SearchableOption }
