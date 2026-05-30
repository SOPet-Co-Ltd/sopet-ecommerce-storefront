import { z } from "zod"

import { checkoutAddressSchema } from "@/components/molecules/AddressForm/schema"
import { paymentMethods } from "@/components/molecules/CheckoutPaymentSelection/Schemas/PaymentSchema"
import {
  cleanCardNumber,
  getCardNumberLength,
  getCvvLength,
} from "@/components/molecules/CheckoutPaymentSelection/Utils/PaymentFormat"

export const newCardDraftSchema = z
  .object({
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
      .regex(/^[a-zA-Z฀-๿\s]+$/, "ชื่อบนบัตรต้องเป็นตัวอักษรเท่านั้น"),
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

export type NewCardDraft = z.infer<typeof newCardDraftSchema>

export const cartLineItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  product_id: z.string().nullish(),
  variant_id: z.string().nullish(),
  title: z.string().nullish(),
})

export const cartSnapshotSchema = z.object({
  id: z.string().min(1),
  region_id: z.string().nullish(),
  currency_code: z.string().min(1),
  email: z.string().nullish(),
  items: z.array(cartLineItemSchema).min(1, "ตะกร้าสินค้าว่างเปล่า"),
  subtotal: z.number().nonnegative().nullish(),
  shipping_total: z.number().nonnegative().nullish(),
  discount_total: z.number().nonnegative().nullish(),
  total: z.number().nonnegative().nullish(),
})

export const customerSessionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("logged_in"),
    customerId: z.string().min(1),
    email: z
      .union([z.literal(""), z.string().trim().email()])
      .nullable()
      .optional(),
  }),
  z.object({
    mode: z.literal("guest"),
    email: z
      .union([z.literal(""), z.string().trim().email()])
      .nullable()
      .optional(),
  }),
])

export const selectedShippingMethodSchema = z.object({
  sellerId: z.string().min(1),
  optionId: z.string().min(1),
})

export const paymentSelectionSchema = z.union([
  z.object({ method: z.literal("promptpay") }),
  z
    .object({
      method: z.literal("card"),
      customerPaymentMethodId: z.string().min(1).optional(),
      omiseToken: z.string().min(1).optional(),
    })
    .refine(
      (data) =>
        Boolean(data.customerPaymentMethodId) || Boolean(data.omiseToken),
      {
        message: "ต้องระบุ customerPaymentMethodId หรือ omiseToken",
        path: ["customerPaymentMethodId"],
      }
    ),
])

export const couponsSelectionSchema = z.object({
  site: z.string().min(1).nullable(),
  vendor: z.record(z.string(), z.array(z.string())).default({}),
})

export const checkoutPayloadSchema = z.object({
  cart: cartSnapshotSchema,
  customerSession: customerSessionSchema,
  shippingAddress: checkoutAddressSchema,
  billingAddress: checkoutAddressSchema,
  shippingMethods: z
    .array(selectedShippingMethodSchema)
    .min(1, "กรุณาเลือกวิธีการจัดส่งสำหรับร้านค้าทุกร้าน"),
  payment: paymentSelectionSchema,
  coupons: couponsSelectionSchema,
  promotions: z.object({
    site: z.array(z.string()).default([]),
    vendor: z.array(z.string()).default([]),
  }),
})

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>
export type CheckoutPaymentMethod = (typeof paymentMethods)[number]
