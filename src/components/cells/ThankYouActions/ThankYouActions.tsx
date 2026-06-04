"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/atoms/Button/Button"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useIsMobile } from "@/lib/utils/is-mobile"
import { ContactCardIcon, QrAddLineOAIcon, SopetCopyIcon } from "@/icons"
import { toast } from "sonner"

const LINE_OA_URL = "https://line.me/R/ti/p/@sopet"
const LINE_ID = "@sopet"

type ThankYouActionsProps = {
  isGuest: boolean
  locale: string
  orderId: string
}

export function ThankYouActions({
  isGuest,
  locale,
  orderId,
}: ThankYouActionsProps) {
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [lineModalOpen, setLineModalOpen] = useState(false)

  const isMobile = useIsMobile()

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (signupModalOpen) setSignupModalOpen(false)
        if (lineModalOpen) setLineModalOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [signupModalOpen, lineModalOpen])

  const handleSignupRedirect = () => {
    window.location.href = `/${locale}/login`
  }

  const handleLineRedirect = () => {
    window.open(LINE_OA_URL, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      {isGuest && (
        <>
          <Button
            size="lg"
            fill
            className="max-w-[230px]"
            onClick={() => setSignupModalOpen(true)}
            aria-label="เปิดหน้าต่างสมัครสมาชิก"
          >
            สมัครสมาชิกกับ Sopet ?
          </Button>

          {signupModalOpen && (
            <Modal
              onClose={() => setSignupModalOpen(false)}
              width={400}
              aria-labelledby="signup-modal-title"
            >
              <div className="flex flex-col gap-sop-20px py-sop-32px">
                <div
                  className="mx-auto bg-sop-primary-300 aspect-square rounded-full flex justify-center items-center lg:w-sop-80px lg:h-sop-80px w-sop-48px h-sop-48px"
                  role="img"
                  aria-label="ไอคอนบัตรติดต่อ"
                >
                  <ContactCardIcon size={isMobile ? 24 : 35} color="#884ECF" />
                </div>
                <div className=" flex flex-col text-center justify-center items-center gap-1">
                  <h3
                    id="signup-modal-title"
                    className="sop-body-md-medium md:sop-body-lg-medium text-sop-neutral-gray-200"
                  >
                    สมัครสมาชิก Sopet ?
                  </h3>
                  <div>
                    {/* TODO : Add discount text if have discount/promotion */}
                    {/* <p>รับส่วนลด XX บาทสำหรับการสั่งซื้อครั้งถัดไป</p> */}
                    <p className="text-sop-neutral-gray-300 sop-body-sm-regular md:sop-body-md-regular">
                      ติดตามพร้อมโปรโมชันสุดพิเศษและติดตาม
                    </p>
                    <p className="text-sop-neutral-gray-300 sop-body-sm-regular md:sop-body-md-regular">
                      คำสั่งซื้อได้ง่ายขึ้น
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 justify-center items-center">
                  <Button
                    size={isMobile ? "md" : "lg"}
                    onClick={handleSignupRedirect}
                    fill
                    className="max-w-[230px]"
                    aria-label="ไปหน้าสมัครสมาชิก"
                  >
                    สมัครเลย
                  </Button>
                  <Button
                    size={isMobile ? "md" : "lg"}
                    variant="filled"
                    fill
                    className="max-w-[230px]"
                    onClick={() => setSignupModalOpen(false)}
                    aria-label="ปิดหน้าต่างและไว้สมัครภายหลัง"
                  >
                    ไว้ภายหลัง
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}

      <Button
        size="lg"
        fill
        className="bg-sop-system-success-500 hover:bg-sop-system-success-400 max-w-[230px]"
        onClick={() => setLineModalOpen(true)}
        aria-label="เปิดหน้าต่างติดตามการสั่งซื้อผ่าน LINE"
      >
        ติดตามการสั่งซื้อผ่าน LINE OA
      </Button>

      {lineModalOpen && (
        <Modal
          onClose={() => setLineModalOpen(false)}
          width={400}
          aria-labelledby="line-modal-title"
        >
          <div className="py-6 flex flex-col gap-6">
            <div className="flex flex-col text-center justify-center items-center">
              <h3
                id="line-modal-title"
                className="sop-body-md-medium md:sop-body-lg-medium text-sop-neutral-gray-200"
              >
                ติดตามสถานะคำสั่งซื้อ
              </h3>
              <p className="text-sop-neutral-gray-300 sop-body-sm-regular md:sop-body-md-regular">
                แชทกับแอดมินผ่าน LINE OA
              </p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-sop-neutral-gray-300 sop-body-sm-regular md:sop-body-md-regular">
                  แจ้งรหัสคำสั่งซื้อ :{" "}
                  <span className="text-sop-secondary-500">{orderId}</span>
                </p>
                <CopyOrderIdButton orderId={orderId} />
              </div>
            </div>
            <div
              className="w-full flex justify-center items-center"
              role="img"
              aria-label="QR Code สำหรับเพิ่มเพื่อน LINE Official Account"
            >
              <QrAddLineOAIcon size={isMobile ? 125 : 160} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex bg-sop-neutral-grayalpha-100 rounded-sop-12px justify-between items-center px-sop-12px py-sop-8px mx-sop-24px">
                <div className="flex-col -space-y-1 items-start">
                  <span
                    className="sop-body-md-light line-clamp-1 text-sop-neutral-gray-200"
                    id="line-id-label-modal"
                  >
                    LINE ID
                  </span>
                  <span
                    className="sop-body-md-regular line-clamp-1 text-sop-neutral-gray-200"
                    aria-labelledby="line-id-label-modal"
                  >
                    {LINE_ID}
                  </span>
                </div>
                <Button
                  size="md"
                  className="bg-sop-system-success-500 hover:bg-sop-system-success-400 max-w-[230px]"
                  onClick={handleLineRedirect}
                  aria-label="เปิด LINE เพื่อเพิ่มเพื่อน Official Account"
                >
                  แอดไลน์เลย
                </Button>
              </div>
              <span
                className="sop-body-sm-light line-clamp-1 text-sop-neutral-gray-200 text-center w-full"
                role="note"
              >
                ปรึกษาปัญหาสัตว์เลี้ยงฟรี 24 ชม.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export function CopyOrderIdButton({ orderId }: { orderId: string }) {
  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId)
      toast.success("คัดลอกรหัสคำสั่งซื้อแล้ว")
    } catch {
      toast.error("ไม่สามารถคัดลอกรหัสคำสั่งซื้อได้")
    }
  }
  return (
    <button
      type="button"
      className="cursor-pointer"
      onClick={handleCopyOrderId}
      aria-label="คัดลอกรหัสคำสั่งซื้อ"
    >
      <SopetCopyIcon size={16} color="#949495" />
    </button>
  )
}
