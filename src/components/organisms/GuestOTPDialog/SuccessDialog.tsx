"use client"

import { CheckCircle2 } from "lucide-react"
import { useEffect } from "react"

export const SuccessDialog = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 w-full max-w-[400px] mx-auto">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <h3 className="heading-xl text-gray-900 mt-2">เข้าสู่ระบบสำเร็จ</h3>
    </div>
  )
}
