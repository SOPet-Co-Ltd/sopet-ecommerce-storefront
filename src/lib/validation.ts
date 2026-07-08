import { z } from "zod"

/** Required string: rejects empty and whitespace-only values (e.g. " "). */
export const requiredTrimmedString = (message?: string) =>
  message ? z.string().trim().min(1, message) : z.string().trim().min(1)

/** Optional string: empty allowed; whitespace-only rejected. */
export const optionalTrimmedString = () =>
  z.union([z.literal(""), z.string().trim().min(1)]).optional()
