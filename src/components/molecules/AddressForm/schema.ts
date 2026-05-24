import { z } from "zod"

const phoneFieldSchema = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => /^0\d{9}$/.test(value.replace(/\D/g, "")), {
      message: "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก",
    })

const optionalPhoneFieldSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => !value || /^0\d{9}$/.test(value.replace(/\D/g, "")), {
    message: "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก",
  })

export const addressSchema = z.object({
  // Trim first so values like "   " don't pass min(1)
  addressId: z.string().trim().min(1).optional(),
  recipientFullName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ / นามสกุล (ผู้รับสินค้า)"),
<<<<<<< Updated upstream
  phone: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์ของคุณ")
    .regex(/^0\d{9}$/, "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"),

  // recipientphone: z
  //   .string()
  //   .trim()
  //   .min(1, "กรุณากรอกเบอร์โทรศัพท์ของคุณ")
  //   .regex(/^0\d{9}$/, "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"),
=======
  contactPhone: optionalPhoneFieldSchema,
  phone: phoneFieldSchema("กรุณากรอกเบอร์โทรศัพท์ (ผู้รับสินค้า)"),
>>>>>>> Stashed changes
  province: z.string().trim().min(1, "กรุณาเลือกจังหวัดของคุณ"),
  district: z.string().trim().min(1, "กรุณาเลือกเขต/อำเภอของคุณ"),
  subDistrict: z.string().trim().min(1, "กรุณาเลือกตำบลของคุณ"),
  postalCode: z.string().trim().min(1, "กรุณาเลือกรหัสไปรษณีย์ของคุณ"),
  address: z.string().trim().min(1, "กรุณากรอกที่อยู่ของคุณ"),
  setAsDefault: z.boolean().optional().default(false),
  email: z
    .union([
      z.literal(""),
      z.string().trim().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    ])
    .optional()
    .nullable(),
})

export const checkoutAddressSchema = addressSchema.extend({
  contactPhone: phoneFieldSchema("กรุณากรอกเบอร์โทรศัพท์ของคุณ"),
})

export type AddressFormData = z.infer<typeof addressSchema>
export type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>
