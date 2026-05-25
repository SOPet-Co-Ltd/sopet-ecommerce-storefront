"use client"

import { InputSOPet } from "@/components/atoms"
import type { InputSOPetProps } from "@/components/atoms"
import {
  formatThaiPhoneSubscriber,
  isValidThaiPhoneNumber,
  normalizeThaiPhoneNumber,
  THAI_PHONE_COUNTRY_CODE,
} from "@/lib/helpers/phone"

type ThaiPhoneInputProps = Omit<
  InputSOPetProps,
  "type" | "value" | "onChange" | "startIcon"
> & {
  value?: string | null
  onValueChange?: (value: string) => void
}

export function ThaiPhoneInput({
  value,
  onValueChange,
  placeholder = "99-999-9999",
  inputMode = "numeric",
  autoComplete = "tel-national",
  className,
  ...props
}: ThaiPhoneInputProps) {
  return (
    <InputSOPet
      {...props}
      type="tel"
      value={formatThaiPhoneSubscriber(value)}
      onChange={(event) => {
        const normalized = normalizeThaiPhoneNumber(event.target.value)
        onValueChange?.(
          isValidThaiPhoneNumber(normalized)
            ? normalized
            : formatThaiPhoneSubscriber(event.target.value)
        )
      }}
      startIcon={
        <span className="sop-body-sm-medium text-sop-neutral-gray-300">
          {THAI_PHONE_COUNTRY_CODE}
        </span>
      }
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      className={className}
    />
  )
}
