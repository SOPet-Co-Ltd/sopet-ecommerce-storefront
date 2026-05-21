"use client"
import { useState, useEffect } from "react"
import { Button, InputSOPet } from "@/components/atoms"
import { useRouter } from "next/navigation"
import { requestOtp, verifyOtpAndLogin } from "@/lib/data/customer"
import { SOPetLogo } from "@/icons"
import { mergeAnonymousCartIntoCustomerAfterLogin } from "@/lib/data/local-customer-cart"

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

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
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
        <div className="flex justify-center items-center flex-col gap-2">
          <h1 className="sop-headline-md-medium md:sop-display-sm-medium">
            ยืนยัน OTP
          </h1>
          <p className="sop-body-xs-regular md:sop-body-sm-regular text-sop-neutral-gray-400">
            รหัส OTP ถูกส่งไปยัง {phone}
          </p>
        </div>
        {/* Form */}
        <div className="space-y-4">
          <InputSOPet
            placeholder="เลข OTP"
            variant="bordered"
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setOtp(e.target.value)
            }
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            variant="primary"
            size="lg"
            fill={true}
            disabled={isVerifying || !otp.trim()}
            onClick={handleVerify}
          >
            {isVerifying ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
          </Button>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              rounded="rounded"
              style={{ padding: "2px 8px", borderRadius: "8px" }}
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
            >
              {cooldown > 0
                ? `ขอ OTP อีกครั้ง (${formatCooldown(cooldown)})`
                : "ขอ OTP อีกครั้ง"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
