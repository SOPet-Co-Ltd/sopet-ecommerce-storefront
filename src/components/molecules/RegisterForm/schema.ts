import { z } from "zod"

export const registerFormSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter first name"),
  lastName: z.string().trim().min(1, "Please enter last name"),
  email: z.string().trim().min(1, "Please enter email").email("Invalid email"),
  password: z
    .string()
    .trim()
    .min(1, "Please enter password")
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
      message:
        "Password must contain at least one uppercase letter and one special character",
    }),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter phone number")
    .regex(/^\+?\d+$/, { message: "Mobile phone must contain digits only" }),
})

export type RegisterFormData = z.infer<typeof registerFormSchema>
