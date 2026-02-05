"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import {
  requestOtpForUpdate,
  verifyOtpAndUpdateContact,
} from "@/lib/data/customer"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ContactType = "email" | "phone"
type ContactMode = "add" | "change"

type ProfileContactOtpFormProps = {
  type: ContactType
  mode: ContactMode
  currentEmail?: string | null
  currentPhone?: string | null
}

const LABELS: Record<ContactType, Record<ContactMode, string>> = {
  email: { add: "อีเมล", change: "อีเมลใหม่" },
  phone: { add: "เบอร์โทรศัพท์", change: "เบอร์โทรศัพท์ใหม่" },
}

const PLACEHOLDERS: Record<ContactType, string> = {
  email: "กรอกอีเมล",
  phone: "กรอกเบอร์โทรศัพท์",
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?\d+$/

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "").trim()
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProfileContactOtpForm({
  type,
  mode,
  currentEmail = null,
  currentPhone = null,
}: ProfileContactOtpFormProps) {
  const router = useRouter()
  const params = useParams()
  const locale = String(params?.locale ?? "")

  const [otpRequested, setOtpRequested] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const label = LABELS[type][mode]
  const placeholder = PLACEHOLDERS[type]

  const handleRequestOtp = async () => {
    const value = identifier.trim()
    if (!value) {
      setError(type === "email" ? "กรุณากรอกอีเมล" : "กรุณากรอกเบอร์โทรศัพท์")
      return
    }
    if (type === "email" && !EMAIL_REGEX.test(value)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }
    if (type === "phone") {
      const normalized = normalizePhone(value)
      if (!PHONE_REGEX.test(normalized)) {
        setError("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
        return
      }
    }
    if (mode === "change") {
      if (type === "email" && value === (currentEmail ?? "").trim()) {
        setError("กรุณากรอกอีเมลใหม่ที่แตกต่างจากของเดิม")
        return
      }
      if (type === "phone") {
        const normalized = normalizePhone(value)
        const current = (currentPhone ?? "").trim()
        if (normalized === current || normalized === normalizePhone(current)) {
          setError("กรุณากรอกเบอร์โทรศัพท์ใหม่ที่แตกต่างจากของเดิม")
          return
        }
      }
    }
    setError(null)
    setLoading(true)
    const valueToSend = type === "phone" ? normalizePhone(value) : value
    const result = await requestOtpForUpdate(valueToSend, type)
    setLoading(false)
    if (result.success) {
      setOtpRequested(true)
      setOtp("")
    } else {
      setError(result.error)
    }
  }

  const handleConfirmOtp = async () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      setError("กรุณากรอก OTP 6 หลักให้ถูกต้อง")
      return
    }
    setError(null)
    setLoading(true)
    const identifierValue =
      type === "phone" ? normalizePhone(identifier.trim()) : identifier.trim()
    const payload =
      type === "email"
        ? { email: identifierValue, otp }
        : { phone: identifierValue, otp }
    const result = await verifyOtpAndUpdateContact(payload)
    setLoading(false)
    if (result.success) {
      router.push(locale ? `/${locale}/user/profile` : "/user/profile")
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  const handleBackToInput = () => {
    setOtpRequested(false)
    setOtp("")
    setError(null)
  }

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value)
    setError(null)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, ""))
    setError(null)
  }

  return (
    <div className="grid grid-cols-[90px_1fr] md:grid-cols-[140px_1fr] gap-x-4 gap-y-4 w-full items-center">
      {/* Row 1: identifier (email or phone) */}
      <label
        htmlFor="contact-identifier"
        className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200"
      >
        {label}
      </label>
      <div className="flex gap-2 items-center w-full flex-wrap">
        <InputSOPet
          id="contact-identifier"
          size="sm"
          type={type === "email" ? "email" : "tel"}
          placeholder={placeholder}
          value={identifier}
          onChange={handleIdentifierChange}
          disabled={otpRequested}
          className="lg:w-[254px] max-w-full"
          variant="bordered"
        />
      </div>

      {/* Row 2: OTP */}
      <label
        htmlFor="contact-otp"
        className="md:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200"
      >
        รหัส OTP
      </label>
      <div className="flex items-center w-full flex-wrap">
        <div className="relative">
          <InputSOPet
            id="contact-otp"
            size="sm"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="กรอกเลข"
            value={otp}
            onChange={handleOtpChange}
            disabled={!otpRequested}
            className="lg:w-[254px] max-w-full"
            variant="bordered"
          />
          <div className="absolute -bottom-sop-40px  md:top-0 md:h-full md:flex items-center justify-end md:justify-start md:-right-sop-96px">
            <Button
              type="button"
              variant="secondary"
              rounded="rounded"
              onClick={handleRequestOtp}
              disabled={loading || otpRequested}
            >
              {loading && !otpRequested ? "กำลังส่ง..." : "ขอ OTP"}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-center col-span-2 mt-sop-48px md:mt-sop-8px">
        <Button
          type="button"
          variant="primary"
          rounded="rounded"
          onClick={handleConfirmOtp}
          disabled={loading || !otpRequested}
        >
          {loading && otpRequested ? "กำลังยืนยัน..." : "ยืนยัน"}
        </Button>
      </div>

      {error && (
        <p className="col-span-2 text-red-500 sop-body-sm-regular">{error}</p>
      )}
    </div>
  )
}
