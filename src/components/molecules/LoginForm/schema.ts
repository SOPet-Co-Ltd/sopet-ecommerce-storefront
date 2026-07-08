import { z } from "zod"

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Please enter email").email("Invalid email"),
  password: z.string().trim().min(1, "Please enter password"),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
