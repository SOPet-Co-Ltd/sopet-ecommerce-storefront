"use client"

import { useState, useRef, useEffect } from "react"
import { Button, Checkbox, InputSOPet } from "@/components/atoms"
import {
  addCustomerPaymentMethod,
  type CustomerPaymentMethod,
} from "@/lib/data/customer"
import {
  cleanCardNumber,
  formatCardNumber,
  formatCVV,
  getCardNumberLength,
  getCvvLength,
} from "@/components/molecules/CheckoutPaymentSelection/Utils/PaymentFormat"

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

type CreditCardFormProps = {
  onSuccess?: (paymentMethod: CustomerPaymentMethod) => void | Promise<void>
}

const fieldLabelClass =
  "sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2"

export const CreditCardForm = ({ onSuccess }: CreditCardFormProps) => {
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [makeDefault, setMakeDefault] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const omiseReady = useRef(false)

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_OMISE_KEY
    if (!publicKey) return

    if (window.Omise) {
      window.Omise.setPublicKey(publicKey)
      omiseReady.current = true
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.omise.co/omise.js"
    script.async = true
    script.onload = () => {
      window.Omise?.setPublicKey(publicKey)
      omiseReady.current = true
    }
    document.head.appendChild(script)
  }, [])

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2)
    return digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const publicKey = process.env.NEXT_PUBLIC_OMISE_KEY
    if (!publicKey) {
      setError("ระบบชำระเงินยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ")
      return
    }

    if (!window.Omise) {
      setError("ไม่สามารถโหลดระบบชำระเงินได้ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง")
      return
    }

    const [expMonth, expYear] = expiry.split("/")
    const expirationMonth = parseInt(expMonth ?? "", 10)
    const expirationYear = parseInt("20" + (expYear ?? ""), 10)

    if (!name.trim()) {
      setError("กรุณากรอกชื่อบนบัตร")
      return
    }
    const cleanedNumber = cleanCardNumber(number)

    if (cleanedNumber.length !== getCardNumberLength(cleanedNumber)) {
      setError("กรุณากรอกหมายเลขบัตรให้ครบ")
      return
    }
    if (isNaN(expirationMonth) || isNaN(expirationYear)) {
      setError("กรุณากรอกวันหมดอายุให้ถูกต้อง")
      return
    }
    if (cvv.length !== getCvvLength(number)) {
      setError("กรุณากรอก CVV ให้ครบ")
      return
    }

    setSubmitting(true)
    setError(null)

    window.Omise.createToken(
      "card",
      {
        name: name.trim(),
        number: cleanedNumber,
        expiration_month: expirationMonth,
        expiration_year: expirationYear,
        security_code: cvv,
      },
      async (statusCode, response) => {
        if (statusCode !== 200 || !response.id) {
          setError(
            response.message ??
              "ไม่สามารถสร้าง token บัตรได้ กรุณาตรวจสอบข้อมูลบัตร"
          )
          setSubmitting(false)
          return
        }

        const res = await addCustomerPaymentMethod({
          paymentMethodId: response.id,
          makeDefault,
        })

        if (res.success) {
          await onSuccess?.(res.paymentMethod)
          setSubmitting(false)
        } else {
          setError(res.error)
          setSubmitting(false)
        }
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="card-name" className={fieldLabelClass}>
          ชื่อบนบัตร
        </label>
        <InputSOPet
          id="card-name"
          size="sm"
          variant="bordered"
          placeholder="ชื่อ นามสกุล (ภาษาอังกฤษ)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="cc-name"
          disabled={submitting}
          aria-required="true"
          aria-invalid={error && !name.trim() ? "true" : "false"}
        />
      </div>

      <div>
        <label htmlFor="card-number" className={fieldLabelClass}>
          หมายเลขบัตร
        </label>
        <InputSOPet
          id="card-number"
          size="sm"
          variant="bordered"
          placeholder="0000 0000 0000 0000"
          value={number}
          inputMode="numeric"
          autoComplete="cc-number"
          onChange={(e) => {
            const cardNumber = formatCardNumber(e.target.value).replace(
              /-/g,
              " "
            )
            setNumber(cardNumber)
            setCvv((currentCvv) => formatCVV(currentCvv, cardNumber))
          }}
          disabled={submitting}
          aria-required="true"
          aria-invalid={error && number ? "true" : "false"}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="card-expiry" className={fieldLabelClass}>
            วันหมดอายุ
          </label>
          <InputSOPet
            id="card-expiry"
            size="sm"
            variant="bordered"
            placeholder="MM/YY"
            value={expiry}
            inputMode="numeric"
            autoComplete="cc-exp"
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            disabled={submitting}
            aria-required="true"
            aria-invalid={error && expiry ? "true" : "false"}
          />
        </div>
        <div className="w-28">
          <label htmlFor="card-cvv" className={fieldLabelClass}>
            CVV
          </label>
          <InputSOPet
            id="card-cvv"
            size="sm"
            variant="bordered"
            placeholder="123"
            value={cvv}
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={getCvvLength(number)}
            onChange={(e) => setCvv(formatCVV(e.target.value, number))}
            disabled={submitting}
            aria-required="true"
            aria-invalid={error && cvv ? "true" : "false"}
          />
        </div>
      </div>

      <Checkbox
        label="ตั้งเป็นบัตรค่าเริ่มต้น"
        checked={makeDefault}
        onChange={(e) => setMakeDefault(e.target.checked)}
        disabled={submitting}
      />

      {error && (
        <p className="label-md text-negative" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={submitting}
        fill
        aria-busy={submitting}
        aria-label={
          submitting ? "กำลังบันทึกบัตร กรุณารอสักครู่" : "บันทึกบัตร"
        }
      >
        {submitting ? "กำลังบันทึก..." : "บันทึกบัตร"}
      </Button>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {submitting && "กำลังบันทึกบัตรเครดิต กรุณารอสักครู่"}
      </div>
    </form>
  )
}
