"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/atoms/Button/Button"
import { Modal } from "@/components/molecules/Modal/Modal"
import { PaymentProviderIcon } from "@/components/atoms/PaymentProviderIcon/PaymentProviderIcon"
import { PlusIcon } from "@/icons"
import {
  getCustomerPaymentMethods,
  updateCustomerPaymentMethod,
  deleteCustomerPaymentMethod,
  type CustomerPaymentMethod,
} from "@/lib/data/customer"
import { cn } from "@/lib/utils"

type UIState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; methods: CustomerPaymentMethod[] }

export const CreditCards = () => {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""

  const [state, setState] = useState<UIState>({ kind: "loading" })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ kind: "loading" })
    const res = await getCustomerPaymentMethods()
    if (res.success) {
      setState({ kind: "ready", methods: res.paymentMethods })
    } else {
      setState({ kind: "error", message: res.error })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSetDefault = async (id: string) => {
    setUpdatingId(id)
    setUpdateError(null)
    const res = await updateCustomerPaymentMethod(id, true)
    if (res.success) {
      await load()
    } else {
      setUpdateError(res.error)
    }
    setUpdatingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await deleteCustomerPaymentMethod(id)
    if (res.success) {
      await load()
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  if (state.kind === "loading") {
    return (
      <div className="text-center pt-8">
        <p className="sop-body-md-regular text-sop-neutral-gray-300">
          กำลังโหลด...
        </p>
      </div>
    )
  }

  if (state.kind === "error") {
    return (
      <div className="text-center pt-8">
        <p className="sop-body-md-regular text-sop-system-error-400">
          {state.message}
        </p>
      </div>
    )
  }

  const { methods } = state

  return (
    <>
      {updateError && (
        <p className="sop-body-md-regular text-sop-system-error-400 mb-4">
          {updateError}
        </p>
      )}

      {methods.length === 0 ? (
        <div className="text-center pt-8">
          <p className="sop-body-md-regular text-sop-neutral-gray-300">
            คุณยังไม่มีบัตรที่บันทึกไว้
          </p>
        </div>
      ) : (
        <>
          {methods.map((pm) => (
            <div
              key={pm.id}
              className="flex flex-col items-start pb-sop-20px mb-sop-20px gap-2 border-b border-sop-neutral-grayalpha-300 relative"
            >
              <div className="flex items-center gap-3">
                <PaymentProviderIcon brand={pm.brand ?? null} size={32} />
                <div className="flex flex-col">
                  <span className="sop-body-md-regular text-sop-base-black">
                    •••• {pm.last4 ?? "****"}
                  </span>
                  {pm.exp_month != null && pm.exp_year != null && (
                    <span className="sop-body-sm-regular text-sop-neutral-gray-300">
                      หมดอายุ {String(pm.exp_month).padStart(2, "0")}/
                      {String(pm.exp_year).slice(-2)}
                    </span>
                  )}
                </div>
              </div>
              {pm.is_default && (
                <span className="sop-body-xs-regular text-sop-secondary-500">
                  ค่าเริ่มต้น
                </span>
              )}
              <div className="flex items-center gap-3 shrink-0 absolute right-0 top-0">
                {!pm.is_default && (
                  <button
                    type="button"
                    disabled={updatingId === pm.id}
                    onClick={() => handleSetDefault(pm.id)}
                    className={cn(
                      "sop-link-md-regular text-sop-additionalblue-500",
                      updatingId === pm.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {updatingId === pm.id
                      ? "กำลังบันทึก..."
                      : "ตั้งเป็นค่าเริ่มต้น"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === pm.id}
                  onClick={() => setConfirmDeleteId(pm.id)}
                  className="sop-link-md-regular text-sop-additionalblue-500"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="flex justify-center pt-6">
        <Button
          type="button"
          onClick={() => router.push(`/${locale}/user/credit/add`)}
          variant="secondary"
          rounded="rounded"
          size="md"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} color="currentColor" />
            เพิ่มบัตร
          </div>
        </Button>
      </div>

      {confirmDeleteId && (
        <Modal
          onClose={() => setConfirmDeleteId(null)}
          header={
            <h2 className="md:sop-headline-lg-medium sop-headline-sm-medium text-[#232323] w-full text-center">
              ยืนยันการลบ
            </h2>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setConfirmDeleteId(null)}
                variant="outline"
                fill
                size="lg"
                disabled={deletingId === confirmDeleteId}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => handleDelete(confirmDeleteId)}
                fill
                size="lg"
                loading={deletingId === confirmDeleteId}
              >
                ลบ
              </Button>
            </div>
          }
        >
          <p className="md:sop-headline-sm-regular sop-body-md-regular text-[#232323] w-full text-center">
            คุณต้องการลบบัตรนี้ใช่หรือไม่
          </p>
        </Modal>
      )}
    </>
  )
}
