"use client"
import { useState, useEffect } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import { useRouter } from "next/navigation"
import { clearMedusaCartForLoginPage, requestOtp } from "@/lib/data/customer"
import { SOPetLogo } from "@/icons"

export const LoginForm = () => {
  return <Form />
}

const isValidPhone = (value: string): boolean => {
  return /^(\+?66|0)[0-9]{8,9}$/.test(value.replace(/[-\s]/g, ""))
}

const applyPhoneMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

const Form = () => {
  const [phone, setPhone] = useState("")
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    clearMedusaCartForLoginPage()
  }, [])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(applyPhoneMask(e.target.value))
  }

  const handleRequestOtp = async () => {
    const rawPhone = phone.replace(/[-\s]/g, "")
    if (!isValidPhone(rawPhone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
      return
    }

    setIsRequestingOtp(true)
    setError("")

    const formData = new FormData()
    formData.append("identifier", rawPhone)

    const res = await requestOtp(formData)
    if (res) {
      setError(res)
      setIsRequestingOtp(false)
      return
    }

    setIsRequestingOtp(false)
    router.push(`/login/otp?phone=${encodeURIComponent(rawPhone)}`)
  }

  return (
    <main className="flex justify-center items-center h-full p-4">
      <div className="space-y-sop-40px md:max-w-[400px] min-w-[300px] w-full">
        {/* Logo */}
        <div className="flex justify-center items-center">
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
        {/* Form */}
        <div className="space-y-4">
          <InputSOPet
            placeholder="เบอร์โทรศัพท์"
            variant="bordered"
            value={phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            variant="primary"
            size="lg"
            fill={true}
            disabled={
              isRequestingOtp || !isValidPhone(phone.replace(/[-\s]/g, ""))
            }
            onClick={handleRequestOtp}
          >
            {isRequestingOtp ? "กำลังส่ง OTP..." : "ขอ OTP"}
          </Button>
          <p className="text-center sop-body-xs-regular md:sop-body-sm-regular text-sop-neutral-gray-400">
            หากยังไม่มีบัญชี ระบบจะสร้างบัญชีอัตโนมัติ
          </p>
        </div>
      </div>
    </main>
  )
}
