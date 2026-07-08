import { z } from "zod"

export const profileDetailsSectionSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  birthDate: z.string().optional(),
})

export type ProfileDetailsSectionFormData = z.infer<
  typeof profileDetailsSectionSchema
>
