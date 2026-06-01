import { z } from "zod"

import { isValidThaiPhoneNumber } from "@/lib/helpers/phone"

export const profileDetailsSchema = z.object({
  firstName: z.string().nonempty("First name is required"),
  lastName: z.string().nonempty("Last name is required"),
  phone: z
    .string()
    .nonempty("Phone number is required")
    .refine(isValidThaiPhoneNumber, "Phone number is invalid"),
  email: z.string().nonempty("Email is required"),
})

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>
