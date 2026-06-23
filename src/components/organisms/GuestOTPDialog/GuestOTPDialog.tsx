"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { useState, useCallback, useEffect, useRef } from "react"
import { PhoneNumberForm } from "./PhoneNumberForm"
import { OTPVerificationForm } from "./OTPVerificationForm"
import { SuccessDialog } from "./SuccessDialog"
import { sendOTP, verifyOTP, checkAuthStatus } from "@/lib/data/auth"

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
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const resendInFlightRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      const initAuth = async () => {
        setIsCheckingAuth(true)
        try {
          const { isAuthenticated, customer } = await checkAuthStatus()
          if (isAuthenticated) {
            onVerified(customer?.phone || "")
          }
        } catch (error) {
          console.error("Auth check failed", error)
        } finally {
          setIsCheckingAuth(false)
        }
      }
      initAuth()
    }
  }, [isOpen, onVerified])

  const handlePhoneSubmit = useCallback(async (phone: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      await sendOTP(phone)
      setPhoneNumber(phone)
      setStep("OTP")
    } catch (e: unknown) {
      setErrorMessage((e as Error).message || "ไม่สามารถส่ง OTP ได้")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleOTPSubmit = useCallback(
    async (otp: string) => {
      setIsLoading(true)
      try {
        await verifyOTP(phoneNumber, otp)
        setStep("SUCCESS")
      } catch (e: unknown) {
        setIsOtpError(true)
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    },
    [phoneNumber]
  )

  const handleResend = useCallback(async () => {
    if (isLoading || resendInFlightRef.current) {
      return
    }

    resendInFlightRef.current = true
    setIsLoading(true)
    try {
      await sendOTP(phoneNumber)
    } catch (e) {
      console.error("Resend failed", e)
    } finally {
      resendInFlightRef.current = false
      setIsLoading(false)
    }
  }, [phoneNumber, isLoading])

  const handleSuccessFinish = useCallback(() => {
    onVerified(phoneNumber)
  }, [onVerified, phoneNumber])

  if (!isOpen) return null

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-xl">
        {step === "PHONE" && (
          <div className="flex flex-col gap-2">
            <PhoneNumberForm
              onSubmit={handlePhoneSubmit}
              isLoading={isLoading}
            />
            {errorMessage && (
              <p className="text-red-500 text-sm text-center">{errorMessage}</p>
            )}
          </div>
        )}
        {step === "OTP" && (
          <OTPVerificationForm
            phoneNumber={phoneNumber}
            onSubmit={handleOTPSubmit}
            onResend={handleResend}
            isError={isOtpError}
            onInputChange={() => setIsOtpError(false)}
            isLoading={isLoading}
          />
        )}
        {step === "SUCCESS" && <SuccessDialog onFinish={handleSuccessFinish} />}
      </div>
    </div>
  )
}
