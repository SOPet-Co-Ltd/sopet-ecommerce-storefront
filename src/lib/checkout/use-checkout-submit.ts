"use client"

import { useCallback, useState } from "react"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { addCustomerPaymentMethod } from "@/lib/data/customer"
import {
  checkoutPayloadSchema,
  type CheckoutPayload,
} from "./checkout-payload-schema"

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
  | { ok: true; payload: CheckoutPayload }
  | {
      ok: false
      reason: "tokenization" | "validation" | "unknown"
      message: string
    }

export function useCheckoutSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildCheckoutPayload = useCheckoutStore(
    (state) => state.buildCheckoutPayload
  )
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod)
  const selectedCardId = useCheckoutStore((state) => state.selectedCardId)
  const newCardDraft = useCheckoutStore((state) => state.newCardDraft)
  const customer = useCheckoutStore((state) => state.customer)
  const setSelectedCardId = useCheckoutStore((state) => state.setSelectedCardId)
  const setNewCardDraft = useCheckoutStore((state) => state.setNewCardDraft)

  const submit = useCallback(async (): Promise<CheckoutSubmitResult> => {
    setError(null)
    setIsSubmitting(true)

    try {
      let omiseToken: string | null = null
      let resolvedCardId: string | null = selectedCardId

      if (paymentMethod === "card" && !selectedCardId) {
        if (!newCardDraft) {
          const message = "กรุณากรอกข้อมูลบัตรเครดิตให้ครบ"
          setError(message)
          return { ok: false, reason: "validation", message }
        }

        const publicKey = process.env.NEXT_PUBLIC_OMISE_KEY
        if (!publicKey) {
          const message = "ระบบชำระเงินยังไม่พร้อม กรุณาติดต่อผู้ดูแลระบบ"
          setError(message)
          return { ok: false, reason: "tokenization", message }
        }

        await ensureOmiseLoaded(publicKey)
        const { month, year } = parseExpiry(newCardDraft.expiry)
        omiseToken = await createOmiseToken({
          name: newCardDraft.cardName.trim(),
          number: newCardDraft.cardNumber.replace(/\s|-/g, ""),
          expiration_month: month,
          expiration_year: year,
          security_code: newCardDraft.cvv,
        })

        if (customer) {
          const saved = await addCustomerPaymentMethod({
            paymentMethodId: omiseToken,
            makeDefault: newCardDraft.setAsDefault,
          })
          if (saved.success) {
            resolvedCardId = saved.paymentMethod.id
            setSelectedCardId(resolvedCardId)
          }
        }

        // Wipe the raw card draft from memory once tokenized.
        setNewCardDraft(null)
      }

      const draft = buildCheckoutPayload() as Record<string, unknown>
      if (paymentMethod === "card") {
        draft.payment = resolvedCardId
          ? { method: "card", customerPaymentMethodId: resolvedCardId }
          : omiseToken
            ? { method: "card", omiseToken }
            : { method: "card" }
      }

      const result = checkoutPayloadSchema.safeParse(draft)
      if (!result.success) {
        const message = "ข้อมูลการชำระเงินไม่ครบถ้วน"
        setError(message)
        return { ok: false, reason: "validation", message }
      }

      return { ok: true, payload: result.data }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการชำระเงิน"
      setError(message)
      return { ok: false, reason: "unknown", message }
    } finally {
      setIsSubmitting(false)
    }
  }, [
    buildCheckoutPayload,
    customer,
    newCardDraft,
    paymentMethod,
    selectedCardId,
    setNewCardDraft,
    setSelectedCardId,
  ])

  return { submit, isSubmitting, error }
}
