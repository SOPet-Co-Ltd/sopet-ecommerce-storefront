import { z } from "zod"

export const addressSchema = z.object({
  // Trim first so values like "   " don't pass min(1)
  addressId: z.string().trim().min(1).optional(),
  recipientFullName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ / นามสกุล (ผู้รับสินค้า)"),
  phone: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์ของคุณ")
    .regex(/^0\d{9}$/, "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"),

  recipientphone: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์ของคุณ")
    .regex(/^0\d{9}$/, "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"),
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

export type AddressFormData = z.infer<typeof addressSchema>
