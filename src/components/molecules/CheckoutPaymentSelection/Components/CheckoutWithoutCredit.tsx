"use client"

import { Controller, useFormContext } from "react-hook-form"

import { Checkbox, InputSOPet } from "@/components/atoms"
import {
  formatCardName,
  formatCardNumber,
  formatCVV,
  formatExpiry,
} from "../Utils/PaymentFormat"
import { PaymentFormData } from "../Types/PaymentType"

export const SelectWithoutCreditCard = () => {
  const { control } = useFormContext<PaymentFormData>()

  return (
    <div>
      <div className="my-sop-20px border-t border-sop-neutral-grayalpha-200" />

      <label className="sop-body-md-regular text-sop-neutral-gray-300">
        ข้อมูลบัตรของคุณ
      </label>

      <div className="mt-sop-20px grid grid-cols-1 gap-4">
        {/* card number */}
        <Controller
          control={control}
          name="cardNumber"
          defaultValue=""
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="หมายเลขบัตร"
              size="sm"
              variant="bordered"
              placeholder="0000-1111-0000-1111"
              inputMode="numeric"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: any) =>
                field.onChange(formatCardNumber(e.target.value))
              }
            />
          )}
        />

        {/* card name */}
        <Controller
          control={control}
          name="cardName"
          defaultValue=""
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="ชื่อบนบัตร"
              size="sm"
              variant="bordered"
              placeholder="จันจิรา เอสโอเพ็ท"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: any) =>
                field.onChange(formatCardName(e.target.value))
              }
            />
          )}
        />

        {/* expiry */}
        <Controller
          control={control}
          name="expiry"
          defaultValue=""
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="วันหมดอายุ"
              size="sm"
              variant="bordered"
              placeholder="MM/YY"
              inputMode="numeric"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: any) =>
                field.onChange(formatExpiry(e.target.value))
              }
            />
          )}
        />

        {/* cvv */}
        <Controller
          control={control}
          name="cvv"
          defaultValue=""
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="รหัส CVV"
              size="sm"
              variant="bordered"
              placeholder="***"
              inputMode="numeric"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: any) => field.onChange(formatCVV(e.target.value))}
            />
          )}
        />
      </div>

      {/* save card */}
      <div className="mt-5.5 mb-sop-16px flex items-center gap-2">
        <Controller
          control={control}
          name="setAsDefault"
          defaultValue={false}
          render={({ field }) => (
            <Checkbox
              label="บันทึกไว้ใช้ครั้งถัดไป และตั้งเป็นค่าเริ่มต้น"
              checked={field.value}
              onChange={(e) =>
                field.onChange((e.target as HTMLInputElement).checked)
              }
            />
          )}
        />
      </div>
    </div>
  )
}
