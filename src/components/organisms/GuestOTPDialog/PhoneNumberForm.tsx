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
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedPhone = normalizeThaiPhoneNumber(phoneNumber)
    if (!isValidThaiPhoneNumber(normalizedPhone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
      return
    }
    setError("")
    onSubmit(normalizedPhone)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto">
      <div className="text-left space-y-2">
        <h3 className="heading-xl text-gray-900" id="phone-form-title">
          กรอกเบอร์มือถือของคุณ
        </h3>
        <p className="text-body-md text-gray-500">
          เพื่อรับรหัส OTP สำหรับยืนยันเบอร์มือถือ
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6"
        noValidate
        aria-labelledby="phone-form-title"
      >
        <div>
          <label htmlFor="guest-phone" className="sr-only">
            เบอร์มือถือ
          </label>
          <ThaiPhoneInput
            id="guest-phone"
            value={phoneNumber}
            onValueChange={(value) => {
              setPhoneNumber(value)
              setError("")
            }}
            placeholder="เบอร์มือถือ"
            className="h-10 text-sop-base-black"
            state={error ? "error" : "default"}
            autoFocus
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "phone-error" : undefined}
            disabled={isLoading}
          />
          {error && (
            <p
              id="phone-error"
              className="text-red-500 text-sm mt-2"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isValidThaiPhoneNumber(phoneNumber) || isLoading}
          loading={isLoading}
          className="w-36 h-10 mx-auto bg-sop-primary-500 text-white hover:bg-sop-primary-600 border-none rounded-xl text-base font-medium"
          aria-busy={isLoading}
          aria-label={isLoading ? "กำลังส่ง OTP กรุณารอสักครู่" : "ขอรหัส OTP"}
        >
          {isLoading ? "กำลังส่ง..." : "ขอรหัส OTP"}
        </Button>
      </form>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "กำลังส่งรหัส OTP กรุณารอสักครู่"}
      </div>
    </div>
  )
}
