"use client"

import { Autocomplete } from "@/components/atoms"
import { SearchIcon } from "@/icons"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback, useMemo, useEffect } from "react"
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "@/lib/helpers/searchHistory"

export const NavbarSearch = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("query") || "")
  const [historyUpdateTrigger, setHistoryUpdateTrigger] = useState(0)

  const performSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        addSearchHistory(trimmedQuery)
        setHistoryUpdateTrigger((prev) => prev + 1)
        router.push(`/categories?query=${encodeURIComponent(trimmedQuery)}`)
      } else {
        router.push("/categories")
      }
    },
    [router]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      performSearch(search)
    },
    [search, performSearch]
  )

  const handleSelectHistoryItem = useCallback(
    (item: string) => {
      performSearch(item)
    },
    [performSearch]
  )

  const clearSearchHistoryCallback = useCallback(() => {
    clearSearchHistory()
    setHistoryUpdateTrigger((prev) => prev + 1)
  }, [])

  const historyOptions = useMemo(
    () =>
      getSearchHistory().map((item) => ({
        value: item,
        label: item,
      })),
    [historyUpdateTrigger]
  )

  useEffect(() => {
    const handleStorageChange = () => {
      setHistoryUpdateTrigger((prev) => prev + 1)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        performSearch(search)
      }
    },
    [search, performSearch]
  )

  return (
    <form className="flex items-center flex-1" onSubmit={handleSubmit}>
      <Autocomplete
        inputProps={{
          className: "rounded-full h-9 min-w-[200px] max-w-[480px] gap-2",
          size: "sm",
          state: "default",
          variant: "flat",
          withDescription: false,
          hasStartIcon: true,
          hasEndIcon: false,
          hasTitle: false,
          startIcon: <SearchIcon />,
          value: search,
          placeholder: "ค้นหาสินค้า",
          onKeyDown: handleKeyDown,
        }}
        onChange={setSearch}
        onOptionSelect={(data) => handleSelectHistoryItem(data.value)}
        showDropdownWhenEmpty={true}
        options={historyOptions}
        customStyles={{
          dropdown:
            "flex flex-col gap-2 border border-sop-neutral-gray-400 rounded-lg mt-1 shadow-lg w-full max-w-[480px] px-4 py-2 absolute z-50 bg-white",
          option: "px-0 py-0",
          innerContainer: "flex flex-wrap gap-2 max-h-60 overflow-auto",
          header: "border-0",
          footer: "border-0 flex justify-center items-center",
        }}
        noResultsText="ไม่มีประวัติการค้นหา"
        footer={() => {
          return (
            <button
              onClick={clearSearchHistoryCallback}
              className="sop-body-xs-regular text-sop-neutral-gray-400 cursor-pointer underline hover:text-sop-neutral-gray-300 transition-all duration-150"
            >
              ล้างประวัติ
            </button>
          )
        }}
        styleType="custom"
        header={() => {
          return (
            <p className="sop-body-sm-light text-sop-neutral-gray-200">
              ค้นหาล่าสุด
            </p>
          )
        }}
        OptionComponent={({ option, onClick }) => {
          return (
            <button
              type="button"
              onClick={onClick}
              className="cursor-pointer md:sop-body-sm-light sop-body-xs-light bg-sop-neutral-gray-500 border border-sop-neutral-gray-400 rounded-full px-3 py-1 hover:bg-sop-neutral-gray-600 text-sop"
            >
              {option.label}
            </button>
          )
        }}
      />
    </form>
  )
}
