import { z } from "zod"

export const addressSchema = z.object({
  addressId: z.string().optional(),
  recipientFullName: z.string().min(1, "ชื่อ-นามสกุล ผู้รับสินค้า is required"),
  phone: z
    .string()
    .min(1, "เบอร์โทรศัพท์ is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  province: z.string().min(1, "จังหวัด is required"),
  district: z.string().min(1, "เขต/อำเภอ is required"),
  subDistrict: z.string().min(1, "แขวง/ตำบล is required"),
  postalCode: z.string().min(1, "รหัสไปรษณีย์ is required"),
  address: z.string().min(1, "ที่อยู่ is required"),
  setAsDefault: z.boolean().optional().default(false),
})

export type AddressFormData = z.infer<typeof addressSchema>
