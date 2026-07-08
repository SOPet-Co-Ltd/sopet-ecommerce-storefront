import { z } from "zod"

export const profilePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, ""),
  newPassword: z.string().trim().min(1, ""),
  confirmPassword: z.string().trim().min(1, ""),
})

export type ProfilePasswordFormData = z.infer<typeof profilePasswordSchema>
