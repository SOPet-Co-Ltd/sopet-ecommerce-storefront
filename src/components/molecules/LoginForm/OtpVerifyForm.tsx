"use client"
import { useState, useEffect, useRef } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import { useRouter } from "next/navigation"
import { requestOtp, verifyOtpAndLogin } from "@/lib/data/customer"
import { SOPetLogo } from "@/icons"
import { mergeAnonymousCartIntoCustomerAfterLogin } from "@/lib/data/local-customer-cart"
import { formatThaiPhoneNumberForDisplay } from "@/lib/helpers/phone"

const OTP_COOLDOWN_SECONDS = 180

const formatCooldown = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export const OtpVerifyForm = ({ phone }: { phone: string }) => {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(OTP_COOLDOWN_SECONDS)
  const router = useRouter()
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Focus error message when error appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleResend = async () => {
    if (isResending) {
      return
    }

    setIsResending(true)
    setError("")

    const formData = new FormData()
    formData.append("identifier", phone)

    const res = await requestOtp(formData)
    if (res) {
      setError(res)
    } else {
      setCooldown(OTP_COOLDOWN_SECONDS)
    }
    setIsResending(false)
  }

  const handleVerify = async () => {
    if (isVerifying) {
      return
    }

    if (!otp.trim()) {
      setError("กรุณากรอก OTP")
      return
    }

    setIsVerifying(true)
    setError("")

    const formData = new FormData()
    formData.append("identifier", phone)
    formData.append("otp", otp.trim())

    const res = await verifyOtpAndLogin(formData)
    if (res) {
      setError(res)
      setIsVerifying(false)
      return
    }

    try {
      await mergeAnonymousCartIntoCustomerAfterLogin()
    } catch (mergeError) {
      console.error(
        "[OtpVerifyForm] Failed to merge anonymous cart after OTP login:",
        mergeError
      )
    }

    setIsVerifying(false)
    router.push("/user")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleVerify()
  }

  return (
    <main className="flex justify-center items-center h-full p-4">
      <div className="space-y-sop-40px md:max-w-[400px] min-w-[300px] w-full">
        {/* Logo */}
        <div
          className="flex justify-center items-center"
          role="img"
          aria-label="SOPet โลโก้"
        >
          <div className="md:block hidden">
            <SOPetLogo size={250} />
          </div>
          <div className="md:hidden block">
            <SOPetLogo size={150} />
          </div>
        </div>
        {/* Title */}
        <div className="flex justify-center items-center flex-col gap-2">
          <h1
            id="otp-title"
            className="sop-headline-md-medium md:sop-display-sm-medium"
          >
            ยืนยัน OTP
          </h1>
          <p className="sop-body-xs-regular md:sop-body-sm-regular text-sop-neutral-gray-400">
            รหัส OTP ถูกส่งไปยัง {formatThaiPhoneNumberForDisplay(phone)}
          </p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-labelledby="otp-title">
          <div className="space-y-4">
            <div>
              <label htmlFor="otp-input" className="sr-only">
                รหัส OTP
              </label>
              <InputSOPet
                id="otp-input"
                placeholder="เลข OTP"
                variant="bordered"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOtp(e.target.value)
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? "otp-error" : "otp-description"}
                autoFocus
              />
              <p id="otp-description" className="sr-only">
                กรุณากรอกรหัส OTP 6 หลักที่ได้รับทาง SMS
              </p>
            </div>
            {error && (
              <div
                id="otp-error"
                ref={errorRef}
                role="alert"
                aria-live="polite"
                className="text-red-500 text-sm"
                tabIndex={-1}
              >
                {error}
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fill={true}
              disabled={isVerifying || !otp.trim()}
              loading={isVerifying}
              aria-busy={isVerifying}
              aria-label={
                isVerifying
                  ? "กำลังยืนยัน OTP กรุณารอสักครู่"
                  : "ยืนยันรหัส OTP"
              }
            >
              {isVerifying ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
            </Button>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="rounded"
                style={{ padding: "2px 8px", borderRadius: "8px" }}
                disabled={isResending || cooldown > 0}
                onClick={handleResend}
                aria-busy={isResending}
                aria-live="polite"
                aria-label={
                  cooldown > 0
                    ? `ขอ OTP อีกครั้งได้ใน ${formatCooldown(cooldown)}`
                    : isResending
                      ? "กำลังส่ง OTP อีกครั้ง"
                      : "ขอ OTP อีกครั้ง"
                }
              >
                {cooldown > 0
                  ? `ขอ OTP อีกครั้ง (${formatCooldown(cooldown)})`
                  : "ขอ OTP อีกครั้ง"}
              </Button>
            </div>
          </div>
        </form>
        {/* Screen reader live region for status updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isVerifying && "กำลังยืนยันรหัส OTP กรุณารอสักครู่"}
          {isResending && "กำลังส่งรหัส OTP ใหม่"}
          {cooldown === 0 && !isResending && "สามารถขอ OTP ใหม่ได้แล้ว"}
        </div>
      </div>
    </main>
  )
}
