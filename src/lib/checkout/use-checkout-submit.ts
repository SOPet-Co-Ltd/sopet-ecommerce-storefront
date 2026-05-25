"use client"

import { useCallback, useState } from "react"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { createContactInformation } from "@/lib/checkout/create-contact-information"
import { bootstrapMarketplacePaymentSessions } from "@/lib/data/cart"
import { addCustomerPaymentMethod } from "@/lib/data/customer"
import {
  isCardProviderId,
  isPromptpayProviderId,
} from "@/lib/helpers/marketplace-checkout-ui"
import {
  checkoutPayloadSchema,
  type CheckoutPayload,
} from "./checkout-payload-schema"
import type { HttpTypes } from "@medusajs/types"

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

const OMISE_SCRIPT_SRC = "https://cdn.omise.co/omise.js"

async function ensureOmiseLoaded(publicKey: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Omise.js can only be loaded in the browser")
  }

  if (!window.Omise) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${OMISE_SCRIPT_SRC}"]`
      )

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener(
          "error",
          () => reject(new Error("ไม่สามารถโหลด Omise.js ได้")),
          { once: true }
        )
        return
      }

      const script = document.createElement("script")
      script.src = OMISE_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("ไม่สามารถโหลด Omise.js ได้"))

      document.head.appendChild(script)
    })
  }

  const omise = window.Omise

  if (!omise) {
    throw new Error("ไม่สามารถโหลด Omise.js ได้")
  }

  omise.setPublicKey(publicKey)
}

function createOmiseToken(data: {
  name: string
  number: string
  expiration_month: number
  expiration_year: number
  security_code: string
}): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.Omise) {
      reject(new Error("Omise.js ยังไม่พร้อมใช้งาน"))
      return
    }

    window.Omise.createToken("card", data, (statusCode, response) => {
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
    })
  })
}

function parseExpiry(expiry: string): { month: number; year: number } {
  const [m, y] = expiry.split("/")

  return {
    month: Number.parseInt(m ?? "", 10),
    year: Number.parseInt(`20${y ?? ""}`, 10),
  }
}

export type CheckoutSubmitResult =
  | {
      ok: true
      payload: CheckoutPayload
      paymentResponse: {
        marketplaceCheckout: unknown
        collectionsById: Record<string, HttpTypes.StorePaymentCollection>
      }
    }
  | {
      ok: false
      reason: "tokenization" | "validation" | "payment" | "unknown"
      message: string
    }

function resolvePaymentProviderId(
  paymentMethods: HttpTypes.StorePaymentProvider[] | null,
  method: "card" | "promptpay"
): string | null {
  if (!paymentMethods?.length) {
    return null
  }

  const unifiedId = paymentMethods.find((p) => isCardProviderId(p.id))?.id
  const cardId =
    paymentMethods.find(
      (p) => isCardProviderId(p.id) && !isPromptpayProviderId(p.id)
    )?.id || unifiedId
  const promptpayId =
    paymentMethods.find((p) => isPromptpayProviderId(p.id))?.id || unifiedId

  return (method === "card" ? cardId : promptpayId) ?? null
}

export function useCheckoutSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shippingAddress = useCheckoutStore((state) => state.shippingAddress)

  const buildCheckoutPayload = useCheckoutStore(
    (state) => state.buildCheckoutPayload
  )

  const paymentMethod = useCheckoutStore((state) => state.paymentMethod)

  const selectedCardId = useCheckoutStore((state) => state.selectedCardId)

  const newCardDraft = useCheckoutStore((state) => state.newCardDraft)

  const customer = useCheckoutStore((state) => state.customer)

  const setSelectedCardId = useCheckoutStore((state) => state.setSelectedCardId)

  const setNewCardDraft = useCheckoutStore((state) => state.setNewCardDraft)

  const addressFormTrigger = useCheckoutStore(
    (state) => state.addressFormTrigger
  )

  const paymentFormTrigger = useCheckoutStore(
    (state) => state.paymentFormTrigger
  )

  const sellerGroups = useCheckoutStore((state) => state.sellerGroups)

  const selectedShippingMethodBySellerId = useCheckoutStore(
    (state) => state.selectedShippingMethodBySellerId
  )

  const cart = useCheckoutStore((state) => state.cart)

  const paymentMethods = useCheckoutStore((state) => state.paymentMethods)

  const submit = useCallback(async (): Promise<CheckoutSubmitResult> => {
    setError(null)
    setIsSubmitting(true)

    console.log("[checkout] submit started", {
      paymentMethod,
      selectedCardId,
      newCardDraft: !!newCardDraft,
    })

    try {
      // Validate address form
      if (addressFormTrigger) {
        const addressValid = await addressFormTrigger()

        console.log("[checkout] address validation:", addressValid)

        if (!addressValid) {
          const message = "กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบถ้วน"

          setError(message)

          console.log("[checkout] FAIL - address invalid")

          return {
            ok: false,
            reason: "validation",
            message,
          }
        }
      }

      // Validate shipping methods
      const sellerIds = Object.keys(sellerGroups)

      const missingSellers = sellerIds.filter(
        (id) => !selectedShippingMethodBySellerId[id]
      )

      console.log("[checkout] shipping validation:", {
        sellerIds,
        selectedShippingMethodBySellerId,
        missingSellers,
      })

      if (missingSellers.length > 0) {
        const message = "กรุณาเลือกวิธีการจัดส่งให้ครบทุกร้านค้า"

        setError(message)

        console.log(
          "[checkout] FAIL - missing shipping methods for sellers:",
          missingSellers
        )

        return {
          ok: false,
          reason: "validation",
          message,
        }
      }

      // Validate payment form
      if (paymentFormTrigger) {
        const paymentValid = await paymentFormTrigger()

        console.log("[checkout] payment validation:", paymentValid)

        if (!paymentValid) {
          const message = "กรุณากรอกข้อมูลการชำระเงินให้ครบถ้วน"

          setError(message)

          console.log("[checkout] FAIL - payment invalid")

          return {
            ok: false,
            reason: "validation",
            message,
          }
        }
      }

      const contactPhone = shippingAddress?.contactPhone?.trim()

      const contactPromise = contactPhone
        ? createContactInformation({
            customer_phone: contactPhone,
            email: shippingAddress?.email?.trim() || null,
          })
        : Promise.resolve()

      let omiseToken: string | null = null
      let resolvedCardId: string | null = selectedCardId

      if (paymentMethod === "card" && !selectedCardId) {
        if (!newCardDraft) {
          const message = "กรุณากรอกข้อมูลบัตรเครดิตให้ครบ"

          setError(message)

          console.log("[checkout] FAIL - no card draft")

          return {
            ok: false,
            reason: "validation",
            message,
          }
        }

        const publicKey = process.env.NEXT_PUBLIC_OMISE_KEY

        if (!publicKey) {
          const message = "ระบบชำระเงินยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ"

          setError(message)

          console.log("[checkout] FAIL - no OMISE_KEY")

          return {
            ok: false,
            reason: "tokenization",
            message,
          }
        }

        await ensureOmiseLoaded(publicKey)

        const { month, year } = parseExpiry(newCardDraft.expiry)

        console.log("[checkout] creating Omise token...")

        const [tokenResult] = await Promise.all([
          createOmiseToken({
            name: newCardDraft.cardName.trim(),
            number: newCardDraft.cardNumber.replace(/\s|-/g, ""),
            expiration_month: month,
            expiration_year: year,
            security_code: newCardDraft.cvv,
          }),

          contactPromise,
        ])

        omiseToken = tokenResult

        console.log("[checkout] Omise token created:", omiseToken)

        if (customer) {
          const saved = await addCustomerPaymentMethod({
            paymentMethodId: omiseToken,
            makeDefault: newCardDraft.setAsDefault,
          })

          console.log("[checkout] save card result:", saved)

          if (saved.success) {
            resolvedCardId = saved.paymentMethod.id

            setSelectedCardId(resolvedCardId)
          }
        }

        setNewCardDraft(null)
      } else {
        await contactPromise
      }

      const draft = buildCheckoutPayload() as Record<string, unknown>

      if (paymentMethod === "card") {
        draft.payment = resolvedCardId
          ? {
              method: "card",
              customerPaymentMethodId: resolvedCardId,
            }
          : omiseToken
            ? {
                method: "card",
                omiseToken,
              }
            : {
                method: "card",
              }
      }

      console.log("[checkout] payload draft:", draft)

      console.log({ draft })

      const result = checkoutPayloadSchema.safeParse(draft)

      if (!result.success) {
        const message = "ข้อมูลการชำระเงินไม่ครบถ้วน"

        setError(message)

        console.log(
          "[checkout] FAIL - payload validation failed:",
          result.error.errors
        )

        return {
          ok: false,
          reason: "validation",
          message,
        }
      }

      console.log("[checkout] SUCCESS - payload:", result.data)

      const methodType: "card" | "promptpay" =
        result.data.payment.method === "promptpay" ? "promptpay" : "card"

      const providerId = resolvePaymentProviderId(paymentMethods, methodType)

      if (!providerId) {
        const message = "ไม่พบผู้ให้บริการชำระเงิน"

        setError(message)

        console.log("[checkout] FAIL - no payment provider for", methodType)

        return {
          ok: false,
          reason: "payment",
          message,
        }
      }

      const sessionData: Record<string, unknown> = {
        payment_method_types: [methodType],
      }

      if (methodType === "card") {
        if (omiseToken) {
          sessionData.omise_token = omiseToken
        } else if (resolvedCardId) {
          sessionData.customer_payment_method_id = resolvedCardId
        }
      }

      try {
        const paymentResponse = await bootstrapMarketplacePaymentSessions(
          cart.id,
          {
            provider_id: providerId,
            data: sessionData,
          }
        )

        console.log("[checkout] payment created:", paymentResponse)

        return {
          ok: true,
          payload: result.data,
          paymentResponse,
        }
      } catch (paymentErr: unknown) {
        const message =
          paymentErr instanceof Error
            ? paymentErr.message
            : "ไม่สามารถสร้างรายการชำระเงินได้"

        setError(message)

        console.log("[checkout] FAIL - payment create:", paymentErr)

        return {
          ok: false,
          reason: "payment",
          message,
        }
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการชำระเงิน"

      setError(message)

      console.log("[checkout] FAIL - exception:", e)

      return {
        ok: false,
        reason: "unknown",
        message,
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [
    addressFormTrigger,
    paymentFormTrigger,
    buildCheckoutPayload,
    shippingAddress,
    customer,
    newCardDraft,
    paymentMethod,
    selectedCardId,
    selectedShippingMethodBySellerId,
    sellerGroups,
    setNewCardDraft,
    setSelectedCardId,
    cart,
    paymentMethods,
  ])

  return {
    submit,
    isSubmitting,
    error,
  }
}
