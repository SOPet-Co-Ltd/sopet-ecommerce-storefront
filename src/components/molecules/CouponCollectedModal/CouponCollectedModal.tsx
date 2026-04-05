"use client"

import { useEffect } from "react"
import { Modal } from "@/components/molecules"

type CouponCollectedModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const CouponCollectedModal = ({
  isOpen,
  onClose,
}: CouponCollectedModalProps) => {
  // Auto-close after 2 seconds
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      onClose()
    }, 2000)
    return () => clearTimeout(timer)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <Modal onClose={onClose} width={600}>
      <div className="flex flex-col items-center justify-center w-full h-[234px]">
        <div className="flex flex-col items-center gap-2">
          {/* Green Check Circle */}
          <div className="w-[120px] h-[120px] rounded-full bg-[#4ade80] flex items-center justify-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Success Text */}
          <p className="sop-headline-md-medium text-black text-center">
            เก็บโค้ดส่วนลดแล้ว
          </p>
        </div>
      </div>
    </Modal>
  )
}
