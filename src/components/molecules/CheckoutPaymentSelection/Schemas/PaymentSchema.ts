import { z } from "zod"
import { PaymentMethod } from "../Types/PaymentType"
import {
  cleanCardNumber,
  getCardNumberLength,
  getCvvLength,
} from "../Utils/PaymentFormat"

export const paymentMethods = [
  "promptpay",
  "card",
] as const satisfies readonly PaymentMethod[]

export const paymentSchema = z
  .object({
    paymentMethod: z.enum(paymentMethods),

    cardNumber: z
      .string()
      .trim()
      .refine((val) => {
        const cleaned = cleanCardNumber(val)
        return (
          /^\d+$/.test(cleaned) &&
          cleaned.length === getCardNumberLength(cleaned)
        )
      }, "หมายเลขบัตรไม่ถูกต้อง"),

    cardName: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อบนบัตร")
      .regex(
        /^[a-zA-Z\u0E00-\u0E7F\s]+$/,
        "ชื่อบนบัตรต้องเป็นตัวอักษรเท่านั้น"
      ),

    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "รูปแบบต้องเป็น MM/YY"),

    cvv: z.string().trim().regex(/^\d+$/, "CVV ไม่ถูกต้อง"),

    setAsDefault: z.boolean().default(false),
  })
  .superRefine(({ cardNumber, cvv }, ctx) => {
    if (cvv.length !== getCvvLength(cardNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "CVV ไม่ถูกต้อง",
      })
    }
  })
