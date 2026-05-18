import { z } from "zod"
import { PaymentMethod } from "../Types/PaymentType"

const cleanCardNumber = (value: string) => value.replace(/\s|-/g, "")

export const paymentMethods = [
  "promptpay",
  "card",
] as const satisfies readonly PaymentMethod[]

export const paymentSchema = z.object({
  paymentMethod: z.enum(paymentMethods),

  cardNumber: z
    .string()
    .trim()
    .refine((val) => {
      const cleaned = cleanCardNumber(val)
      return /^\d{16}$/.test(cleaned)
    }, "หมายเลขบัตรต้องเป็น 16 หลัก"),

  cardName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อบนบัตร")
    .regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, "ชื่อบนบัตรต้องเป็นตัวอักษรเท่านั้น"),

  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "รูปแบบต้องเป็น MM/YY"),

  cvv: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, "CVV ไม่ถูกต้อง"),

  setAsDefault: z.boolean().default(false),
})
