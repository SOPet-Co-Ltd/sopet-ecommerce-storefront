"use client"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { Input } from "../Input/Input"
import type { InputProps } from "../Input/Input"

export interface AutocompleteOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  [key: string]: any // Allow additional custom properties
}

export interface AutocompleteStyleConfig {
  dropdown?: string
  innerContainer?: string
  header?: string
  footer?: string
  option?: string
  optionHovered?: string
  optionSelected?: string
  noResults?: string
}

export interface OptionComponentProps {
  option: AutocompleteOption
  isHovered: boolean
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
}

// Default option component
export const DefaultOptionComponent = ({
  option,
  onClick,
  onMouseEnter,
}: OptionComponentProps) => (
  <div
    className="flex items-start gap-3"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
  >
    {option.icon && <span className="shrink-0 mt-0.5">{option.icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm truncate">{option.label}</div>
      {option.description && (
        <div className="text-xs text-sop-neutral-gray-400 mt-0.5 line-clamp-2">
          {option.description}
        </div>
      )}
    </div>
  </div>
)

export interface AutocompleteProps {
  // Input props - pass through to Input component
  inputProps?: Omit<InputProps, "onChange">

  // Autocomplete specific props
  options: AutocompleteOption[]
  onOptionSelect?: (option: AutocompleteOption) => void
  onChange?: (value: string) => void

  // Custom class names
  className?: string
  filterFunction?: (option: AutocompleteOption, inputValue: string) => boolean
  noResultsText?: string
  maxResults?: number
  showDropdownWhenEmpty?: boolean

  // Header/Footer
  footer?: () => JSX.Element
  header?: () => JSX.Element

  // Style customization
  styleType?: "predefined" | "custom"
  customStyles?: AutocompleteStyleConfig

  // Option component customization
  OptionComponent?: React.ComponentType<OptionComponentProps>
  optionComponentProps?: Partial<
    Omit<OptionComponentProps, "option" | "onClick" | "onMouseEnter">
  >
}

const predefinedStyles: AutocompleteStyleConfig = {
  dropdown:
    "absolute z-50 w-full mt-1 bg-white border border-sop-neutral-gray-400 rounded-lg shadow-lg",
  innerContainer: "max-h-60 overflow-auto",
  header: "border-b border-sop-neutral-gray-400",
  footer: "border-t border-sop-neutral-gray-400",
  option: "px-4 py-3 cursor-pointer transition-colors duration-150",
  optionHovered: "bg-sop-neutral-gray-500",
  optionSelected: "bg-sop-primary-50 text-sop-primary-500",
  noResults: "px-4 py-3 text-sop-neutral-gray-400 text-center",
}

export function Autocomplete({
  inputProps = {},
  options = [],
  onOptionSelect,
  onChange,
  filterFunction,
  noResultsText = "No results found",
  maxResults,
  showDropdownWhenEmpty = false,
  styleType = "predefined",
  customStyles,
  OptionComponent = DefaultOptionComponent,
  optionComponentProps,
  className,
  footer: Footer,
  header: Header,
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState<string>(
    String(inputProps.value) || ""
  )
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1)
  const [selectedOption, setSelectedOption] =
    useState<AutocompleteOption | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync internal state with external value prop
  useEffect(() => {
    setInputValue(String(inputProps.value) || "")
  }, [inputProps.value])

  // Merge styles based on styleType
  const styles: AutocompleteStyleConfig =
    styleType === "custom" && customStyles
      ? { ...predefinedStyles, ...customStyles }
      : predefinedStyles

  // Default filter function
  const defaultFilterFunction = (option: AutocompleteOption, value: string) => {
    const searchValue = value.toLowerCase()
    return (
      option.label.toLowerCase().includes(searchValue) ||
      option.value.toLowerCase().includes(searchValue) ||
      (option.description &&
        option.description.toLowerCase().includes(searchValue))
    )
  }

  const filter = filterFunction || defaultFilterFunction

  // Filter options based on input value
  const filteredOptions = inputValue
    ? options
        .filter((option) => filter(option, inputValue))
        .slice(0, maxResults)
    : options.slice(0, maxResults)

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setIsOpen(true)
    setHoveredIndex(-1)
    if (onChange) {
      onChange(value)
    }
  }

  // Handle option selection
  const handleOptionClick = (option: AutocompleteOption) => {
    setInputValue(option.label)
    setSelectedOption(option)
    setIsOpen(false)
    setHoveredIndex(-1)
    if (onOptionSelect) {
      onOptionSelect(option)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle navigation if dropdown is open and has options
    if (!isOpen || filteredOptions.length === 0) {
      // Pass through to custom handler if no dropdown interaction
      if (inputProps.onKeyDown) {
        inputProps.onKeyDown(e)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHoveredIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHoveredIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case "Enter":
        // Only prevent default if we're selecting from dropdown
        if (hoveredIndex >= 0 && hoveredIndex < filteredOptions.length) {
          e.preventDefault()
          handleOptionClick(filteredOptions[hoveredIndex])
        } else {
          // No option is hovered, pass to custom handler or let form submit
          if (inputProps.onKeyDown) {
            inputProps.onKeyDown(e)
          }
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setHoveredIndex(-1)
        break
    }
  }

  // Scroll hovered option into view
  useEffect(() => {
    if (hoveredIndex >= 0 && dropdownRef.current) {
      const hoveredElement = dropdownRef.current.children[
        hoveredIndex
      ] as HTMLElement
      if (hoveredElement) {
        hoveredElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [hoveredIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHoveredIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Determine if dropdown should be shown
  const shouldShowDropdown = isOpen && (inputValue || showDropdownWhenEmpty)

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Input
        {...inputProps}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />

      {shouldShowDropdown && (
        <div className={styles.dropdown}>
          {Header && (
            <div className={styles.header}>
              <Header />
            </div>
          )}
          <div ref={dropdownRef} className={styles.innerContainer}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className={cn(
                    styles.option,
                    hoveredIndex === index && styles.optionHovered,
                    selectedOption?.value === option.value &&
                      styles.optionSelected
                  )}
                >
                  <OptionComponent
                    option={option}
                    isHovered={hoveredIndex === index}
                    isSelected={selectedOption?.value === option.value}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    {...optionComponentProps}
                  />
                </div>
              ))
            ) : (
              <div className={styles.noResults}>{noResultsText}</div>
            )}
          </div>
          {Footer && (
            <div className={styles.footer}>
              <Footer />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
