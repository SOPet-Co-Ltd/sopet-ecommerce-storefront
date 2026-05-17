import { z } from "zod"

export const addressSchema = z.object({
  // Trim first so values like "   " don't pass min(1)
  addressId: z.string().trim().min(1).optional(),
  recipientFullName: z
    .string()
    .trim()
    .min(1, "ชื่อ-นามสกุล ผู้รับสินค้า is required"),
  phone: z
    .string()
    .trim()
    .min(1, "เบอร์โทรศัพท์ is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  province: z.string().trim().min(1, "จังหวัด is required"),
  district: z.string().trim().min(1, "เขต/อำเภอ is required"),
  subDistrict: z.string().trim().min(1, "แขวง/ตำบล is required"),
  postalCode: z.string().trim().min(1, "รหัสไปรษณีย์ is required"),
  address: z.string().trim().min(1, "ที่อยู่ is required"),
  setAsDefault: z.boolean().optional().default(false),
  email: z
    .string()
    .trim()
    .min(1, "อีเมล is required")
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
