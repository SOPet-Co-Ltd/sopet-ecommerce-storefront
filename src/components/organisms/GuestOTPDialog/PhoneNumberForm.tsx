"use client"

import { Button } from "@/components/atoms"
import { useState } from "react"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import {
  isValidThaiPhoneNumber,
  normalizeThaiPhoneNumber,
} from "@/lib/helpers/phone"

export const PhoneNumberForm = ({
  onSubmit,
  isLoading = false,
}: {
  onSubmit: (phone: string) => void
  isLoading?: boolean
}) => {
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedPhone = normalizeThaiPhoneNumber(phoneNumber)
    if (isValidThaiPhoneNumber(normalizedPhone)) {
      onSubmit(normalizedPhone)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto">
      <div className="text-left space-y-2">
        <h3 className="heading-xl text-gray-900">กรอกเบอร์มือถือของคุณ</h3>
        <p className="text-body-md text-gray-500">
          เพื่อรับรหัส OTP สำหรับยืนยันเบอร์มือถือ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <ThaiPhoneInput
          value={phoneNumber}
          onValueChange={setPhoneNumber}
          placeholder="เบอร์มือถือ"
          className="h-10 text-sop-base-black"
          state="default"
          autoFocus
        />

        <Button
          type="submit"
          disabled={!isValidThaiPhoneNumber(phoneNumber) || isLoading}
          loading={isLoading}
          className="w-36 h-10 mx-auto bg-sop-primary-500 text-white hover:bg-sop-primary-600 border-none rounded-xl text-base font-medium"
        >
          ขอรหัส OTP
        </Button>
      </form>
    </div>
  )
}
