"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/atoms"
import { useRouter } from "next/navigation"
import { clearMedusaCartForLoginPage, requestOtp } from "@/lib/data/customer"
import { SOPetLogo } from "@/icons"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import {
  isValidThaiPhoneNumber,
  normalizeThaiPhoneNumber,
} from "@/lib/helpers/phone"

export type LoginNotice = "sessionRequired" | "sessionExpired" | null

type LoginFormProps = {
  notice?: LoginNotice
}

export const LoginForm = ({ notice = null }: LoginFormProps) => {
  return <Form notice={notice} />
}

const NOTICE_MESSAGES: Record<Exclude<LoginNotice, null>, string> = {
  sessionRequired: "กรุณาเข้าสู่ระบบเพื่อใช้งานส่วนนี้",
  sessionExpired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
}

const Form = ({ notice }: { notice: LoginNotice }) => {
  const [phone, setPhone] = useState("")
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    clearMedusaCartForLoginPage()
  }, [])

  // Focus error message when error appears for screen readers
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleRequestOtp = async () => {
    if (isRequestingOtp) {
      return
    }

    const normalizedPhone = normalizeThaiPhoneNumber(phone)
    if (!isValidThaiPhoneNumber(normalizedPhone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
      return
    }

    setIsRequestingOtp(true)
    setError("")

    const formData = new FormData()
    formData.append("identifier", normalizedPhone)

    const res = await requestOtp(formData)
    if (res) {
      setError(res)
      setIsRequestingOtp(false)
      return
    }

    setIsRequestingOtp(false)
    router.push(`/login/otp?phone=${encodeURIComponent(normalizedPhone)}`)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleRequestOtp()
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
        <div className="flex justify-center items-center">
          <h1 className="sop-headline-md-medium md:sop-display-sm-medium">
            เข้าสู่ระบบ
          </h1>
        </div>
        {notice && (
          <p
            className="sop-body-sm-regular text-sop-neutral-gray-400 text-center rounded-lg bg-sop-neutral-grayalpha-50 px-4 py-3"
            role="status"
          >
            {NOTICE_MESSAGES[notice]}
          </p>
        )}
        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
          <div className="space-y-4">
            <div>
              <label htmlFor="phone-input" className="sr-only">
                เบอร์โทรศัพท์
              </label>
              <ThaiPhoneInput
                id="phone-input"
                placeholder="เบอร์โทรศัพท์"
                variant="bordered"
                value={phone}
                onValueChange={setPhone}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? "phone-error" : undefined}
                autoFocus
              />
            </div>
            {error && (
              <div
                id="phone-error"
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
              disabled={isRequestingOtp || !isValidThaiPhoneNumber(phone)}
              loading={isRequestingOtp}
              aria-busy={isRequestingOtp}
              aria-label={
                isRequestingOtp ? "กำลังส่ง OTP กรุณารอสักครู่" : "ขอรหัส OTP"
              }
            >
              {isRequestingOtp ? "กำลังส่ง OTP..." : "ขอ OTP"}
            </Button>
            <p className="text-center sop-body-xs-regular md:sop-body-sm-regular text-sop-neutral-gray-400">
              หากยังไม่มีบัญชี ระบบจะสร้างบัญชีอัตโนมัติ
            </p>
          </div>
        </form>
        {/* Screen reader live region for status updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isRequestingOtp && "กำลังส่งรหัส OTP กรุณารอสักครู่"}
        </div>
      </div>
    </main>
  )
}
