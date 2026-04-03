"use client"

import { Modal } from "@/components/molecules"
import { Button } from "@/components/atoms"
import Link from "next/link"

type CouponAuthErrorModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const CouponAuthErrorModal = ({
  isOpen,
  onClose,
}: CouponAuthErrorModalProps) => {
  if (!isOpen) return null

  return (
    <Modal onClose={onClose} width={400}>
      <div className="flex flex-col items-center justify-center w-full px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center gap-4 text-center w-full">
          {/* Warning Icon */}
          <div className="w-sop-80px h-sop-80px rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="sop-headline-sm-medium text-gray-800">
              เข้าสู่ระบบเพื่อเก็บคูปอง
            </h3>
            <p className="sop-body-sm-regular text-gray-500">
              กรุณาเข้าสู่ระบบก่อนเพื่อรับสิทธิพิเศษและส่วนลดมากมายจาก SOPET
            </p>
          </div>

          <div className="flex gap-3 mt-6 w-full">
            <Button
              className="flex-1 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full h-11 transition-colors"
              onClick={onClose}
            >
              ไว้ทีหลัง
            </Button>
            <Link href="/login" className="flex-1 block w-full">
              <Button className="w-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white rounded-full h-11 shadow-sm transition-colors border-none">
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  )
}
