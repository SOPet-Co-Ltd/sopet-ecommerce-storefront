"use client"

import { useState } from "react"
import { loadStripe, StripeCardElementOptions } from "@stripe/stripe-js"
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { Button, Checkbox, InputSOPet } from "@/components/atoms"
import { addCustomerPaymentMethod } from "@/lib/data/customer"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

type InnerFormProps = {
  onSuccess?: () => void
}

const stripeElementStyle: StripeCardElementOptions = {
  style: {
    base: {
      // Use the same primary font as the app (Mitr)
      fontFamily:
        '"Mitr", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
      fontSize: "14px",
      lineHeight: "22px",
      // Match InputSOPet text / placeholder tones as closely as possible
      color: "#211F23",
      "::placeholder": {
        color: "#949495",
      },
    },
  },
}

const cardNumberOptions: StripeCardElementOptions = stripeElementStyle
const cardExpiryOptions: StripeCardElementOptions = stripeElementStyle
const cardCvcOptions: StripeCardElementOptions = stripeElementStyle

const CreditCardInnerForm = ({ onSuccess }: InnerFormProps) => {
  const stripe = useStripe()
  const elements = useElements()

  const [cardholderName, setCardholderName] = useState("")
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError("ไม่สามารถโหลดระบบชำระเงินได้ กรุณาลองใหม่อีกครั้ง")
      return
    }

    const cardElement = elements.getElement(CardNumberElement)

    if (!cardElement) {
      setError("ไม่พบฟอร์มบัตรเครดิต กรุณารีเฟรชหน้าแล้วลองใหม่")
      return
    }

    try {
      setIsSubmitting(true)

      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: cardholderName?.trim() || undefined,
          },
        })

      if (stripeError || !paymentMethod) {
        setError(stripeError?.message || "ไม่สามารถบันทึกข้อมูลบัตรได้")
        return
      }

      const result = await addCustomerPaymentMethod({
        paymentMethodId: paymentMethod.id,
        makeDefault: setAsDefault,
      })

      if (!result.success) {
        // Check if it's a duplicate card error using error type/code
        const errorMessage = result.error || "ไม่สามารถบันทึกข้อมูลบัตรได้"
        if (
          result.type === "duplicate_payment_method" ||
          result.code === "duplicate_payment_method"
        ) {
          setError("บัตรนี้ถูกบันทึกไว้ในบัญชีของคุณแล้ว")
        } else {
          setError(errorMessage)
        }
        return
      }

      onSuccess?.()
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!stripe || !elements) {
    return (
      <div className="space-y-4">
        <p className="sop-body-sm-regular text-sop-neutral-gray-300 text-center">
          กำลังโหลดแบบฟอร์มบัตร...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Card number */}
        <div className="w-full h-[44px] p-2 rounded-[8px] sop-body-sm-regular text-sop-neutral-gray-200 bg-sop-neutral-gray-600 border border-solid border-sop-neutral-grayalpha-100 flex items-center">
          <div className="w-full">
            <CardNumberElement options={cardNumberOptions} />
          </div>
        </div>

        {/* Expiry + CVC */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="w-full h-[44px] p-2 rounded-[8px] sop-body-sm-regular text-sop-neutral-gray-200 bg-sop-neutral-gray-600 border border-solid border-sop-neutral-grayalpha-100 flex items-center">
              <div className="w-full">
                <CardExpiryElement options={cardExpiryOptions} />
              </div>
            </div>
          </div>
          <div>
            <div className="w-full h-[44px] p-2 rounded-[8px] sop-body-sm-regular text-sop-neutral-gray-200 bg-sop-neutral-gray-600 border border-solid border-sop-neutral-grayalpha-100 flex items-center">
              <div className="w-full">
                <CardCvcElement options={cardCvcOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Cardholder name */}
        <InputSOPet
          size="sm"
          variant="bordered"
          placeholder="กรอกชื่อ-นามสกุลตามหน้าบัตร"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
        />
      </div>

      {error && (
        <p className="sop-body-xs-regular text-sop-system-error-400 text-center">
          {error}
        </p>
      )}

      <div>
        <Button
          type="submit"
          rounded="rounded"
          variant="secondary"
          disabled={isSubmitting || !stripe || !elements}
        >
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกบัตร"}
        </Button>
      </div>
    </form>
  )
}

type CreditCardFormProps = {
  onSuccess?: () => void
}

export const CreditCardCheckoutForm = ({ onSuccess }: CreditCardFormProps) => {
  if (!stripePromise || !stripeKey) {
    return (
      <p className="sop-body-md-regular text-sop-system-error-400">
        ไม่สามารถเริ่มต้นการชำระเงินได้ เนื่องจากยังไม่ได้ตั้งค่า Stripe Key
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        // Explicitly load Mitr inside Stripe iframes so fontFamily works
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Mitr:wght@200;300;400;500;600;700&display=swap",
          },
        ],
      }}
    >
      <CreditCardInnerForm onSuccess={onSuccess} />
    </Elements>
  )
}
