import { z } from "zod"

export const patchCartItemSchema = z
  .object({
    quantity: z.number().int().positive(),
  })
  .strict()
