"use client"
import { useState } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { requestOtp, verifyOtpAndLogin } from "@/lib/data/customer"
import { initiateOAuth } from "@/lib/data/oauth"
import {
  SOPetLogo,
  FacebookCustomIcon,
  GoogleIcon,
  LineCustomIcon,
} from "@/icons"
import { useRouter } from "next/navigation"

export const RegisterForm = () => {
  return <Form />
}

const Form = () => {
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [otpRequested, setOtpRequested] = useState(false)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const router = useRouter()

  const isValidEmailOrPhone = (value: string | null | undefined): boolean => {
    if (!value || value.trim() === "") {
      return false
    }

    const trimmedValue = value.trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const phoneRegex = /^(\+?66|0)[0-9]{9,10}$/

    return (
      emailRegex.test(trimmedValue) ||
      phoneRegex.test(trimmedValue.replace(/\s+/g, ""))
    )
  }

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์")
      return
    }

    setIsRequestingOtp(true)
    setError(undefined)

    const formData = new FormData()
    formData.append("identifier", identifier.trim().toLowerCase())

    const res = await requestOtp(formData)
    if (res) {
      setError(res)
      setIsRequestingOtp(false)
      return
    }

    setOtpRequested(true)
    setIsRequestingOtp(false)
  }

  const handleVerifyAndLogin = async () => {
    if (!identifier.trim()) {
      setError("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์")
      return
    }
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setError("กรุณากรอก OTP 6 หลักให้ถูกต้อง")
      return
    }

    setIsVerifying(true)
    setError(undefined)

    const formData = new FormData()
    formData.append("identifier", identifier.trim().toLowerCase())
    formData.append("otp", otp.trim())

    const res = await verifyOtpAndLogin(formData)
    if (res) {
      setError(res)
      setIsVerifying(false)
      return
    }

    setIsVerifying(false)
    router.push("/user")
  }

  return (
    <main className="flex justify-center items-center h-full p-4 ">
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
          <h1
            id="register-title"
            className="sop-headline-md-medium md:sop-display-sm-medium"
          >
            สร้างบัญชีใหม่
          </h1>
        </div>
        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (otpRequested) {
              handleVerifyAndLogin()
            } else {
              handleRequestOtp()
            }
          }}
          noValidate
          aria-labelledby="register-title"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="sr-only">
                อีเมลล์หรือเบอร์โทรศัพท์
              </label>
              <InputSOPet
                id="identifier"
                placeholder="อีเมลล์/เบอร์โทรศัพท์"
                variant="bordered"
                value={identifier}
                disabled={otpRequested || isRequestingOtp || isVerifying}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setIdentifier(e.target.value)
                  setError(undefined)
                }}
                aria-required="true"
                aria-invalid={!!error && !identifier.trim()}
                aria-describedby={error ? "register-error" : undefined}
              />
            </div>
            <div className="relative md:mb-4 mb-12">
              <label htmlFor="otp" className="sr-only">
                เลข OTP
              </label>
              <InputSOPet
                id="otp"
                placeholder="เลข OTP"
                variant="bordered"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setOtp(e.target.value)
                  setError(undefined)
                }}
                disabled={isVerifying}
                aria-required={otpRequested}
                aria-invalid={!!error && otpRequested && !otp.trim()}
                aria-describedby={
                  otpRequested
                    ? error
                      ? "register-error"
                      : "otp-sent-message"
                    : undefined
                }
              />
              <div className="absolute right-0 min-w-[190px] md:-right-[200px] md:top-0 md:bottom-0 -bottom-sop-36px flex items-center justify-end md:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  rounded="rounded"
                  style={{ padding: "2px 8px", borderRadius: "8px" }}
                  disabled={isRequestingOtp || !isValidEmailOrPhone(identifier)}
                  onClick={handleRequestOtp}
                  aria-busy={isRequestingOtp}
                  aria-label={
                    isRequestingOtp
                      ? "กำลังส่ง OTP กรุณารอสักครู่"
                      : "ขอรหัส OTP"
                  }
                >
                  {isRequestingOtp ? "กำลังส่ง..." : "ขอ OTP"}
                </Button>
              </div>
            </div>
            {otpRequested && (
              <p
                id="otp-sent-message"
                className="sop-body-xs-regular md:sop-body-sm-regular text-sop-neutral-gray-400 px-1"
                role="status"
                aria-live="polite"
              >
                รหัส OTP ถูกส่งไปยังเบอร์โทรศัพท์ของคุณ
              </p>
            )}
            {error && (
              <p
                id="register-error"
                className="text-red-500 text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fill={true}
              disabled={
                isVerifying ||
                !otpRequested ||
                !otp.trim() ||
                !identifier.trim()
              }
              aria-busy={isVerifying}
              aria-label={
                isVerifying
                  ? "กำลังสร้างบัญชี กรุณารอสักครู่"
                  : "สร้างบัญชีใหม่"
              }
            >
              {isVerifying ? "กำลังเข้าสู่ระบบ..." : "สร้างบัญชีใหม่"}
            </Button>
          </div>
        </form>
        {/* Divider */}
        <div className="flex justify-center items-center gap-2">
          <span className="w-full h-px bg-[#DEDEDE]" aria-hidden="true"></span>
          <p className="sop-headline-sm-regular text-sop-neutral-gray-300">
            หรือ
          </p>
          <span className="w-full h-px bg-[#DEDEDE]" aria-hidden="true"></span>
        </div>
        {/* Media Login */}
        <div className="flex justify-center items-center gap-8">
          <button
            type="button"
            onClick={() => initiateOAuth("facebook")}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="สร้างบัญชีด้วย Facebook"
          >
            <FacebookCustomIcon size={48} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => initiateOAuth("google")}
            className="flex justify-center items-center bg-sop-base-white aspect-square rounded-full overflow-clip w-sop-48px h-sop-48px border-[#EEEEEE] cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="สร้างบัญชีด้วย Google"
          >
            <GoogleIcon size={28} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => initiateOAuth("line")}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="สร้างบัญชีด้วย LINE"
          >
            <LineCustomIcon size={48} aria-hidden="true" />
          </button>
        </div>
        {/* Link to Sign Up */}
        <div className="flex justify-center items-center gap-1">
          {/* TODO - Fix color */}
          <p className="sop-body-lg-regular text-[#888888]">
            หากคุณมีบัญชีแล้ว
          </p>
          <LocalizedClientLink href="/login" className="underline">
            <button
              type="button"
              className="sop-link-lg-regular text-sop-primary-500 cursor-pointer"
              aria-label="ไปที่หน้าเข้าสู่ระบบ"
            >
              เข้าสู่ระบบ
            </button>
          </LocalizedClientLink>
        </div>
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isRequestingOtp && "กำลังส่งรหัส OTP กรุณารอสักครู่"}
          {isVerifying && "กำลังสร้างบัญชีและเข้าสู่ระบบ กรุณารอสักครู่"}
        </div>
      </div>
    </main>
  )
}
