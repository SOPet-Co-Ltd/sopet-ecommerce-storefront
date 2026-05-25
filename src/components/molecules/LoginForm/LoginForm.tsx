"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/atoms"
import { useRouter } from "next/navigation"
import { clearMedusaCartForLoginPage, requestOtp } from "@/lib/data/customer"
import { SOPetLogo } from "@/icons"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import {
  isValidThaiPhoneNumber,
  normalizeThaiPhoneNumber,
} from "@/lib/helpers/phone"

export const LoginForm = () => {
  return <Form />
}

const Form = () => {
  const [phone, setPhone] = useState("")
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    clearMedusaCartForLoginPage()
  }, [])

  const handleRequestOtp = async () => {
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
          <ThaiPhoneInput
            placeholder="เบอร์โทรศัพท์"
            variant="bordered"
            value={phone}
            onValueChange={setPhone}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            variant="primary"
            size="lg"
            fill={true}
            disabled={isRequestingOtp || !isValidThaiPhoneNumber(phone)}
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
