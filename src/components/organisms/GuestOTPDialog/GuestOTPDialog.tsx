"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { useState } from "react"
import { PhoneNumberForm } from "./PhoneNumberForm"
import { OTPVerificationForm } from "./OTPVerificationForm"
import { SuccessDialog } from "./SuccessDialog"

type Step = "PHONE" | "OTP" | "SUCCESS"

export const GuestOTPDialog = ({
  onVerified,
  isOpen,
}: {
  onVerified: (phoneNumber: string) => void
  isOpen: boolean
}) => {
  const [step, setStep] = useState<Step>("PHONE")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isOtpError, setIsOtpError] = useState(false)

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone)
    // Here we would call API to request OTP
    console.log("Requesting OTP for", phone)
    setStep("OTP")
  }

  const handleOTPSubmit = (otp: string) => {
    // Here we would verify OTP
    console.log("Verifying OTP", otp)

    // Simulate API call
    if (otp === "111111") {
      setStep("SUCCESS")
    } else {
      setIsOtpError(true)
    }
  }

  const handleSuccessFinish = () => {
    onVerified(phoneNumber)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl">
        {step === "PHONE" && <PhoneNumberForm onSubmit={handlePhoneSubmit} />}
        {step === "OTP" && (
          <OTPVerificationForm
            phoneNumber={phoneNumber}
            onSubmit={handleOTPSubmit}
            onResend={() => console.log("Resend OTP")}
            isError={isOtpError}
            onInputChange={() => setIsOtpError(false)}
          />
        )}
        {step === "SUCCESS" && <SuccessDialog onFinish={handleSuccessFinish} />}
      </div>
    </div>
  )
}
