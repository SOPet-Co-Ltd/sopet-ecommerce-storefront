"use client"

import React from "react"
import { Button, Checkbox, PaymentProviderIcon } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { PlusIcon } from "@/icons"
import {
  CustomerPaymentMethod,
  deleteCustomerPaymentMethod,
  updateCustomerPaymentMethod,
} from "@/lib/data/customer"
import { cn } from "@/lib/utils"
import { isEmpty } from "lodash"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

type CreditCardsProps = {
  paymentMethods: CustomerPaymentMethod[]
}

export const CreditCards = ({ paymentMethods }: CreditCardsProps) => {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""

  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const goToAddCard = () => router.push(`/${locale}/user/credit/add`)

  const editingCard = editingCardId
    ? paymentMethods.find((m) => m.id === editingCardId)
    : null

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setIsDeleting(true)
      await deleteCustomerPaymentMethod(paymentMethodId)
      setDeleteCardId(null)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (paymentMethodId: string) => {
    const method = paymentMethods.find((m) => m.id === paymentMethodId)
    if (method) {
      setEditingCardId(paymentMethodId)
      setIsDefault(method.is_default)
    }
  }

  const handleSave = async () => {
    if (!editingCardId) return

    try {
      setIsSaving(true)
      const result = await updateCustomerPaymentMethod(editingCardId, isDefault)
      if (result.success) {
        setEditingCardId(null)
        setIsDefault(false)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingCardId(null)
    setIsDefault(false)
  }

  if (isEmpty(paymentMethods)) {
    return (
      <div className="text-center pt-8">
        <p className="sop-body-md-regular text-sop-neutral-gray-300">
          คุณยังไม่มีบัตรเครดิต/เดบิตที่บันทึกไว้ <br />
          เพิ่มบัตรเพื่อให้การสั่งซื้อสะดวกขึ้น
        </p>
        <div className="flex justify-center pt-6">
          <Button
            type="button"
            onClick={goToAddCard}
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
      </div>
    )
  }

  return (
    <>
      {paymentMethods.map((method) => {
        const cardLabel = method.last4 ? `****${method.last4}` : null

        return (
          <div
            key={method.id}
            className={cn(
              "flex items-center justify-between pb-sop-20px mb-sop-20px gap-3 border-b border-sop-neutral-grayalpha-300"
            )}
          >
            <div className="flex items-center gap-3">
              <PaymentProviderIcon
                brand={method.brand}
                size={40}
                className="shrink-0"
              />
              <span className="md:sop-body-lg-regular sop-body-md-regular text-sop-neutral-gray-300">
                {cardLabel || "บัตรที่บันทึกไว้"}
              </span>
            </div>
            {method.is_default && (
              <span className="sop-body-xs-regular md:sop-body-md-regular text-sop-secondary-500">
                ค่าเริ่มต้น
              </span>
            )}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleEdit(method.id)}
                className="sop-link-md-regular text-sop-additionalblue-500"
              >
                แก้ไข
              </button>
              <button
                type="button"
                onClick={() => setDeleteCardId(method.id)}
                className="sop-link-md-regular text-sop-additionalblue-500"
              >
                ลบ
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex justify-center pt-6">
        <Button
          type="button"
          onClick={goToAddCard}
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

      {deleteCardId && (
        <Modal
          onClose={() => (isDeleting ? null : setDeleteCardId(null))}
          header={
            <h2 className="md:sop-headline-lg-medium sop-headline-sm-medium text-[#232323] w-full text-center">
              ยืนยันการลบ
            </h2>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setDeleteCardId(null)}
                variant="outline"
                fill
                size="lg"
                disabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => handleDelete(deleteCardId)}
                fill
                size="lg"
                disabled={isDeleting}
              >
                {isDeleting ? "กำลังลบ..." : "ลบ"}
              </Button>
            </div>
          }
        >
          <p className="md:sop-headline-sm-regular sop-body-md-regular text-[#232323] w-full text-center">
            คุณต้องการลบบัตรนี้
          </p>
        </Modal>
      )}

      {editingCardId && editingCard && (
        <Modal
          onClose={handleCancel}
          header={
            <div className="border-b border-sop-neutral-grayalpha-300 pb-3">
              <h2 className="sop-body-lg-regular text-sop-primary-500">
                แก้ไขบัตร
              </h2>
            </div>
          }
          footer={
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="secondary"
                fill
                disabled={isSaving}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={isSaving} fill>
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <span className="sop-body-sm-regular text-sop-neutral-gray-300">
                  ประเภทบัตร
                </span>
                <p className="sop-body-md-regular text-sop-base-black">
                  {editingCard.brand
                    ? editingCard.brand.toUpperCase()
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <span className="sop-body-sm-regular text-sop-neutral-gray-300">
                  หมายเลขบัตร
                </span>
                <p className="sop-body-md-regular text-sop-base-black">
                  {editingCard.last4 ? `•••• ${editingCard.last4}` : "ไม่ระบุ"}
                </p>
              </div>
              {editingCard.exp_month && editingCard.exp_year && (
                <div>
                  <span className="sop-body-sm-regular text-sop-neutral-gray-300">
                    วันหมดอายุ
                  </span>
                  <p className="sop-body-md-regular text-sop-base-black">
                    {String(editingCard.exp_month).padStart(2, "0")}/
                    {String(editingCard.exp_year).slice(-2)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                label="ตั้งเป็นบัตรเริ่มต้น"
                checked={isDefault}
                onChange={(e) =>
                  setIsDefault(
                    (e?.target as HTMLInputElement)?.checked ?? false
                  )
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
