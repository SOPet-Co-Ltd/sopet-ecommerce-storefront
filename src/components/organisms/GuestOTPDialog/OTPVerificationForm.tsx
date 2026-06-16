"use client"

import { Button } from "@/components/atoms"
import { formatThaiPhoneNumberForDisplay } from "@/lib/helpers/phone"
import { useEffect, useRef, useState } from "react"

export const OTPVerificationForm = ({
  phoneNumber,
  onSubmit,
  onResend,
  isError = false,
  onInputChange,
  isLoading = false,
}: {
  phoneNumber: string
  onSubmit: (otp: string) => void
  onResend: () => void
  isError?: boolean
  onInputChange?: () => void
  isLoading?: boolean
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const lastSubmittedOtp = useRef<string>("")

  useEffect(() => {
    inputRefs.current[0]?.focus()
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    onInputChange?.()

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Auto-submit when all fields are filled
  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      const otpString = otp.join("")
      if (otpString !== lastSubmittedOtp.current) {
        lastSubmittedOtp.current = otpString
        onSubmit(otpString)
      }
    } else {
      lastSubmittedOtp.current = ""
    }
  }, [otp, onSubmit])

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto text-center">
      <div className="space-y-2 text-left">
        <h3 className="heading-xl text-gray-900" id="otp-form-title">
          ยืนยันเบอร์มือถือของคุณ
        </h3>
        <p className="text-body-md text-gray-500">
          กรอกรหัส OTP ที่ส่งไปยังเบอร์{" "}
          {formatThaiPhoneNumberForDisplay(phoneNumber)}
        </p>
      </div>

      <div
        className="flex justify-between gap-2 md:gap-3 px-2"
        role="group"
        aria-labelledby="otp-form-title"
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-10 h-12 md:w-12 md:h-14 text-center text-xl font-medium rounded-xl border ${
              isError
                ? "border-red-500"
                : "border-gray-200 focus:border-sop-primary-500 focus:ring-1 focus:ring-sop-primary-500"
            } outline-none transition-all`}
            aria-label={`รหัส OTP หลักที่ ${index + 1}`}
            aria-required="true"
            aria-invalid={isError}
            disabled={isLoading}
          />
        ))}
      </div>

      {isError && (
        <p className="text-red-500 text-sm" role="alert" aria-live="polite">
          รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
        </p>
      )}

      <>
        {timeLeft > 0 ? (
          <div className="text-body-md text-gray-500 text-left">
            ไม่ได้รับรหัส OTP? {""}
            <span className="text-gray-400" aria-live="polite">
              ขอรหัสผ่านใหม่ใน 0:
              {timeLeft.toString().padStart(2, "0")}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTimeLeft(60)
              onResend()
            }}
            className="text-sop-primary-500 font-medium hover:underline cursor-pointer"
            aria-label="ขอรับรหัส OTP ใหม่"
          >
            ขอรับรหัส OTP ใหม่
          </button>
        )}
      </>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "กำลังตรวจสอบรหัส OTP กรุณารอสักครู่"}
        {isError && "รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"}
      </div>
    </div>
  )
}
