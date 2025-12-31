import type { Meta, StoryObj } from "@storybook/react"
import { Autocomplete, AutocompleteOption, OptionComponentProps } from "./Autocomplete"
import { MagnifyingGlass, MapPin, Tag, User } from "@medusajs/icons"

const meta: Meta<typeof Autocomplete> = {
  title: "Atoms/Autocomplete",
  component: Autocomplete,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    styleType: {
      control: "select",
      options: ["predefined", "custom"],
      description: "Style configuration type",
    },
    noResultsText: {
      control: "text",
      description: "Text to show when no results found",
    },
    maxResults: {
      control: "number",
      description: "Maximum number of results to show",
    },
  },
}

export default meta
type Story = StoryObj<typeof Autocomplete>

// Sample data
const productOptions: AutocompleteOption[] = [
  {
    value: "laptop-1",
    label: "MacBook Pro 14-inch",
    description: "Apple M3 Pro chip, 18GB RAM, 512GB SSD",
    icon: <Tag />,
  },
  {
    value: "laptop-2",
    label: "MacBook Air 13-inch",
    description: "Apple M2 chip, 8GB RAM, 256GB SSD",
    icon: <Tag />,
  },
  {
    value: "phone-1",
    label: "iPhone 15 Pro",
    description: "128GB, Titanium finish",
    icon: <Tag />,
  },
  {
    value: "phone-2",
    label: "iPhone 15",
    description: "256GB, Multiple colors available",
    icon: <Tag />,
  },
  {
    value: "tablet-1",
    label: "iPad Pro 12.9-inch",
    description: "M2 chip, 256GB, Wi-Fi + Cellular",
    icon: <Tag />,
  },
]

const locationOptions: AutocompleteOption[] = [
  {
    value: "bangkok",
    label: "Bangkok",
    description: "Capital city of Thailand",
    icon: <MapPin />,
  },
  {
    value: "chiang-mai",
    label: "Chiang Mai",
    description: "Northern Thailand",
    icon: <MapPin />,
  },
  {
    value: "phuket",
    label: "Phuket",
    description: "Southern Thailand, Island province",
    icon: <MapPin />,
  },
  {
    value: "pattaya",
    label: "Pattaya",
    description: "Beach resort city",
    icon: <MapPin />,
  },
]

const userOptions: AutocompleteOption[] = [
  {
    value: "user-1",
    label: "John Doe",
    description: "john.doe@example.com",
    icon: <User />,
  },
  {
    value: "user-2",
    label: "Jane Smith",
    description: "jane.smith@example.com",
    icon: <User />,
  },
  {
    value: "user-3",
    label: "Bob Johnson",
    description: "bob.johnson@example.com",
    icon: <User />,
  },
]

// Default inputProps to reuse across stories
const defaultInputProps = {
  size: "md" as const,
  variant: "flat" as const,
  hasTitle: true,
  title: "Search Products",
  isRequired: false,
  hasStartIcon: true,
  startIcon: <MagnifyingGlass />,
  placeholder: "Type to search products...",
}

// Default story - Product search
export const Default: Story = {
  args: {
    inputProps: defaultInputProps,
    options: productOptions,
    styleType: "predefined",
    onOptionSelect: (option) => {
      console.log("Selected:", option)
    },
  },
}

// With bordered variant
export const Bordered: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      variant: "bordered",
      title: "Search Location",
      placeholder: "Type to search location...",
    },
    options: locationOptions,
  },
}

// With underlined variant
export const Underlined: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      variant: "underlined",
      title: "Search Users",
      placeholder: "Type to search users...",
    },
    options: userOptions,
  },
}

// Small size
export const SmallSize: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      size: "sm",
      title: "Quick Search",
    },
  },
}

// With description
export const WithDescription: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      withDescription: true,
      descriptionText: "Start typing to see suggestions",
    },
  },
}

// With error state
export const ErrorState: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      state: "error",
      withDescription: true,
      descriptionText: "Please select a valid product",
    },
  },
}

// Limited results
export const LimitedResults: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Search (Max 3 results)",
    },
    maxResults: 3,
  },
}

// Custom styles
export const CustomStyles: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Custom Styled Search",
    },
    styleType: "custom",
    customStyles: {
      dropdown: "absolute z-50 w-full mt-2 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl shadow-2xl max-h-60 overflow-auto",
      option: "px-5 py-4 cursor-pointer transition-all duration-200",
      optionHovered: "bg-purple-100 scale-[0.98] mx-1 rounded-xl",
      optionSelected: "bg-gradient-to-r from-purple-500 to-blue-500 text-white mx-1 rounded-xl",
      noResults: "px-5 py-4 text-purple-400 text-center font-semibold",
    },
  },
}

// Without icons
export const WithoutIcons: Story = {
  args: {
    ...Default.args,
    options: productOptions.map(opt => ({
      value: opt.value,
      label: opt.label,
      description: opt.description,
    })),
  },
}

// Simple options (no descriptions)
export const SimpleOptions: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Simple Search",
    },
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
      { value: "3", label: "Option 3" },
      { value: "4", label: "Option 4" },
      { value: "5", label: "Option 5" },
    ],
  },
}

// Required field
export const Required: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      isRequired: true,
    },
  },
}

// Custom filter function - only match from start
export const CustomFilter: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Search (Starts with)",
    },
    filterFunction: (option, value) => {
      return option.label.toLowerCase().startsWith(value.toLowerCase())
    },
  },
}

// With end icon
export const WithEndIcon: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      hasEndIcon: true,
      endIcon: <Tag />,
    },
  },
}

// No results example
export const NoResults: Story = {
  args: {
    ...Default.args,
    options: [],
    noResultsText: "😕 No products found. Try a different search term.",
  },
}

// Custom container styles
export const CustomContainer: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Styled Container",
    },
    className: "max-w-md",
    styleType: "custom",
    customStyles: {
      dropdown: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto backdrop-blur-sm",
      option: "px-4 py-3 cursor-pointer transition-all duration-150 hover:pl-5",
      optionHovered: "bg-blue-50 border-l-4 border-blue-500",
      optionSelected: "bg-green-50 border-l-4 border-green-500 font-semibold",
      noResults: "px-4 py-3 text-gray-400 text-center italic",
    },
  },
}

// Custom Option Component - Compact Layout
const CompactOptionComponent = ({ option, onClick, onMouseEnter }: OptionComponentProps) => (
  <div className="flex items-center justify-between gap-2" onClick={onClick} onMouseEnter={onMouseEnter}>
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {option.icon && <span className="shrink-0">{option.icon}</span>}
      <span className="font-medium text-sm truncate">{option.label}</span>
    </div>
    <span className="text-xs text-sop-neutral-gray-400 shrink-0">
      {option.value}
    </span>
  </div>
)

export const CustomOptionComponent: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Compact Option Layout",
    },
    OptionComponent: CompactOptionComponent,
  },
}

// Custom Option Component - Card Style
const CardOptionComponent = ({ option, isHovered, onClick, onMouseEnter }: OptionComponentProps) => (
  <div 
    className={`p-3 rounded-lg border transition-all ${isHovered ? 'border-sop-primary-500 shadow-md' : 'border-transparent'}`}
    onClick={onClick} 
    onMouseEnter={onMouseEnter}
  >
    <div className="flex items-start gap-3">
      {option.icon && (
        <div className="w-10 h-10 rounded-full bg-sop-primary-50 flex items-center justify-center shrink-0">
          {option.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1">{option.label}</div>
        {option.description && (
          <div className="text-xs text-sop-neutral-gray-400">{option.description}</div>
        )}
      </div>
    </div>
  </div>
)

export const CardStyleOption: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Card Style Options",
    },
    OptionComponent: CardOptionComponent,
    customStyles: {
      dropdown: "absolute z-50 w-full mt-1 bg-white border border-sop-neutral-gray-400 rounded-lg shadow-lg max-h-96 overflow-auto p-2",
      option: "mb-2 last:mb-0",
      optionHovered: "",
      optionSelected: "ring-2 ring-sop-primary-500",
    },
    styleType: "custom",
  },
}

// Custom Option Component - With Badge
const BadgeOptionComponent = ({ option, onClick, onMouseEnter }: OptionComponentProps) => (
  <div className="flex items-center gap-3" onClick={onClick} onMouseEnter={onMouseEnter}>
    {option.icon && <span className="shrink-0">{option.icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm">{option.label}</div>
      {option.description && (
        <div className="text-xs text-sop-neutral-gray-400 mt-0.5">{option.description}</div>
      )}
    </div>
    {option.badge && (
      <span className="shrink-0 px-2 py-1 bg-sop-primary-500 text-white text-xs rounded-full">
        {option.badge}
      </span>
    )}
  </div>
)

const productOptionsWithBadges: AutocompleteOption[] = productOptions.map(opt => ({
  ...opt,
  badge: opt.value.includes('pro') ? 'Pro' : 'New',
}))

export const WithBadges: Story = {
  args: {
    ...Default.args,
    inputProps: {
      ...defaultInputProps,
      title: "Options with Badges",
    },
    options: productOptionsWithBadges,
    OptionComponent: BadgeOptionComponent,
  },
}
