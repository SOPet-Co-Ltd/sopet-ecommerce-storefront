import { z } from "zod"

import { isValidThaiPhoneNumber } from "@/lib/helpers/phone"

export const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidThaiPhoneNumber, "Phone number is invalid"),
  email: z.string().trim().min(1, "Email is required"),
})

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>
