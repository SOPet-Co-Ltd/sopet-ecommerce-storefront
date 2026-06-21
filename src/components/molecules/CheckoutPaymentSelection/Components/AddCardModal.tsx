"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button, Checkbox, InputSOPet } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import {
  cleanCardNumber,
  formatCardName,
  formatCardNumber,
  formatCVV,
  formatExpiry,
  getCvvLength,
} from "../Utils/PaymentFormat"
import {
  addCustomerPaymentMethod,
  type CustomerPaymentMethod,
} from "@/lib/data/customer"

declare global {
  interface Window {
    Omise?: {
      setPublicKey: (key: string) => void
      createToken: (
        type: "card",
        data: {
          name: string
          number: string
          expiration_month: number
          expiration_year: number
          security_code: string
        },
        callback: (
          statusCode: number,
          response: { id?: string; message?: string }
        ) => void
      ) => void
    }
  }
}

type AddCardFormData = {
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
  setAsDefault: boolean
}

type Props = {
  onClose: () => void
  onSuccess: (paymentMethod: CustomerPaymentMethod) => void
}

const OMISE_SCRIPT_SRC = "https://cdn.omise.co/omise.js"

export const AddCardModal = ({ onClose, onSuccess }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [omiseReady, setOmiseReady] = useState(false)

  const { control, handleSubmit, watch, setValue, getValues } =
    useForm<AddCardFormData>({
      defaultValues: {
        cardNumber: "",
        cardName: "",
        expiry: "",
        cvv: "",
        setAsDefault: false,
      },
    })

  const cardNumber = watch("cardNumber")

  // Load Omise.js script
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_OMISE_KEY
    if (!publicKey) {
      setError("ระบบชำระเงินยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ")
      return
    }

    if (window.Omise) {
      window.Omise.setPublicKey(publicKey)
      setOmiseReady(true)
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${OMISE_SCRIPT_SRC}"]`
    )

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          window.Omise?.setPublicKey(publicKey)
          setOmiseReady(true)
        },
        { once: true }
      )
      return
    }

    const script = document.createElement("script")
    script.src = OMISE_SCRIPT_SRC
    script.async = true
    script.onload = () => {
      window.Omise?.setPublicKey(publicKey)
      setOmiseReady(true)
    }
    script.onerror = () => {
      setError("ไม่สามารถโหลดระบบชำระเงินได้ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง")
    }

    document.head.appendChild(script)
  }, [])

  const onSubmit = async (data: AddCardFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (!window.Omise) {
        throw new Error(
          "ระบบชำระเงินยังไม่พร้อม กรุณารีเฟรชหน้าแล้วลองอีกครั้ง"
        )
      }

      // Parse expiry date
      const [expMonth, expYear] = data.expiry.split("/")
      const expirationMonth = parseInt(expMonth?.trim() ?? "", 10)
      const expirationYear = parseInt("20" + (expYear?.trim() ?? ""), 10)

      if (isNaN(expirationMonth) || isNaN(expirationYear)) {
        throw new Error("กรุณากรอกวันหมดอายุให้ถูกต้อง (MM/YY)")
      }

      // Clean card number
      const cleanedNumber = cleanCardNumber(data.cardNumber)

      // Create Omise token
      const paymentMethodId = await new Promise<string>((resolve, reject) => {
        window.Omise!.createToken(
          "card",
          {
            name: data.cardName.trim(),
            number: cleanedNumber,
            expiration_month: expirationMonth,
            expiration_year: expirationYear,
            security_code: data.cvv,
          },
          (statusCode, response) => {
            if (statusCode !== 200 || !response.id) {
              reject(
                new Error(
                  response.message ??
                    "ไม่สามารถสร้าง token บัตรได้ กรุณาตรวจสอบข้อมูลบัตร"
                )
              )
              return
            }
            resolve(response.id)
          }
        )
      })

      // Save payment method to backend
      const result = await addCustomerPaymentMethod({
        paymentMethodId,
        makeDefault: data.setAsDefault,
      })

      if (result.success) {
        onSuccess(result.paymentMethod)
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกบัตร"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      header={
        <h2 className="sop-heading-xs text-sop-neutral-gray-100">
          เพิ่มบัตรใหม่
        </h2>
      }
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกบัตร"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        {/* Card Number */}
        <Controller
          control={control}
          name="cardNumber"
          rules={{ required: "กรุณากรอกหมายเลขบัตร" }}
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="หมายเลขบัตร"
              size="sm"
              variant="bordered"
              placeholder="0000-1111-0000-1111"
              inputMode="numeric"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const formatted = formatCardNumber(e.target.value)
                field.onChange(formatted)
                setValue("cvv", formatCVV(getValues("cvv"), formatted))
              }}
            />
          )}
        />

        {/* Card Name */}
        <Controller
          control={control}
          name="cardName"
          rules={{ required: "กรุณากรอกชื่อบนบัตร" }}
          render={({ field, fieldState }) => (
            <InputSOPet
              isRequire
              title="ชื่อบนบัตร"
              size="sm"
              variant="bordered"
              placeholder="จันจิรา เอสโอเพ็ท"
              state={fieldState.error ? "error" : "default"}
              description={fieldState.error?.message}
              value={field.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.onChange(formatCardName(e.target.value))
              }
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Expiry */}
          <Controller
            control={control}
            name="expiry"
            rules={{ required: "กรุณากรอกวันหมดอายุ" }}
            render={({ field, fieldState }) => (
              <InputSOPet
                isRequire
                title="วันหมดอายุ"
                size="sm"
                variant="bordered"
                placeholder="MM/YY"
                inputMode="numeric"
                state={fieldState.error ? "error" : "default"}
                description={fieldState.error?.message}
                value={field.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.onChange(formatExpiry(e.target.value))
                }
              />
            )}
          />

          {/* CVV */}
          <Controller
            control={control}
            name="cvv"
            rules={{ required: "กรุณากรอกรหัส CVV" }}
            render={({ field, fieldState }) => (
              <InputSOPet
                isRequire
                title="รหัส CVV"
                size="sm"
                variant="bordered"
                placeholder="***"
                inputMode="numeric"
                state={fieldState.error ? "error" : "default"}
                description={fieldState.error?.message}
                value={field.value}
                maxLength={getCvvLength(cardNumber)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.onChange(formatCVV(e.target.value, cardNumber))
                }
              />
            )}
          />
        </div>

        {/* Set as Default */}
        <Controller
          control={control}
          name="setAsDefault"
          render={({ field }) => (
            <Checkbox
              label="ตั้งเป็นบัตรเริ่มต้น"
              checked={field.value}
              onChange={(e) =>
                field.onChange((e.target as HTMLInputElement).checked)
              }
            />
          )}
        />

        {/* Error Message */}
        {error && (
          <p className="sop-body-xs-regular text-sop-system-error-400">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
