import { cn } from "@/lib/utils"

type SelectBoxProps<T extends string> = {
  children: React.ReactNode
  rightIcon?: React.ReactNode
  value: T
  selectedValue: T
  onChange: (value: T) => void
  name: string
  className?: string
  radioTopOnMobile?: boolean
}

export const SelectBox = <T extends string>({
  children,
  rightIcon,
  value,
  selectedValue,
  onChange,
  name,
  className = "",
  radioTopOnMobile = false,
}: SelectBoxProps<T>) => {
  const checked = value === selectedValue

  return (
    <label
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-sop-16px border bg-white px-sop-24px py-sop-20px",
        checked
          ? "border-sop-primary-500"
          : "border-sop-neutral-grayalpha-200 ",
        checked && className
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onChange(value)}
        className="hidden"
      />

      <div
        className={cn(
          "flex w-full gap-sop-16px",
          radioTopOnMobile ? "items-start md:items-center" : "items-center"
        )}
      >
        {" "}
        <div
          className={cn(
            "relative h-sop-20px w-sop-20px shrink-0 rounded-full border",
            checked
              ? "border-sop-primary-500"
              : "border-sop-neutral-grayalpha-200"
          )}
        >
          {checked && (
            <div className="absolute left-1/2 top-1/2 h-sop-8px w-sop-8px -translate-x-1/2 -translate-y-1/2 rounded-full bg-sop-primary-500" />
          )}
        </div>
        <div className="pointer-events-none flex-1 sop-body-md-regular text-sop-neutral-gray-200">
          {children}
        </div>
      </div>

      {rightIcon}
    </label>
  )
}
