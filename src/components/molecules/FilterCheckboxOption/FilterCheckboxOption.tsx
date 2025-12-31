import { Checkbox } from "@/components/atoms"
import { cn } from "@/lib/utils"

export const FilterCheckboxOption = ({
  label,
  amount,
  checked = false,
  onCheck = () => null,
  disabled = false,
}: {
  label: string
  amount?: number
  checked?: boolean
  onCheck?: (option: string) => void
  disabled?: boolean
}) => {
  return (
    <label
      className={cn(
        "flex items-center cursor-pointer gap-2",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onClick={() => (disabled ? null : onCheck(label))}
    >
      <Checkbox checked={checked} disabled={disabled} />
      <span className="sop-body-sm-regular text-sop-neutral-gray-200">
        {label}
        {amount && <span className="sop-body-sm-regular"> ({amount})</span>}
      </span>
    </label>
  )
}
