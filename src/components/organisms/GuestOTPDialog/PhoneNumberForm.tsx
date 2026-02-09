"use client"

import { Button } from "@/components/atoms"
import { Input } from "@/components/atoms"
import { useState } from "react"
import { Phone } from "lucide-react"

export const PhoneNumberForm = ({
  onSubmit,
  isLoading = false,
}: {
  onSubmit: (phone: string) => void
  isLoading?: boolean
}) => {
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phoneNumber.length >= 9) {
      onSubmit(phoneNumber)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto">
      <div className="text-left space-y-2">
        <h3 className="heading-xl text-gray-900">กรอกเบอร์มือถือของคุณ</h3>
        <p className="text-body-md text-gray-500">
          เพื่อรับรหัส OTP สำหรับยืนยันเบอร์มือถือ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="flex gap-3">
          <div className="w-sop-80px shrink-0">
            <div className="h-10 w-full bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-medium">
              +66
            </div>
          </div>
          <div className="flex-1">
            <Input
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "")
                if (value.length <= 10) setPhoneNumber(value)
              }}
              placeholder="เบอร์มือถือ"
              className="h-10 text-sop-base-black"
              state="default"
              hasTitle={false}
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={phoneNumber.length < 9 || isLoading}
          loading={isLoading}
          className="w-36 h-10 mx-auto bg-sop-primary-500 text-white hover:bg-sop-primary-600 border-none rounded-xl text-base font-medium"
        >
          ขอรหัส OTP
        </Button>
      </form>
    </div>
  )
}
