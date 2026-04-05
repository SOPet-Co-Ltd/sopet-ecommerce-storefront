const DEFAULT_MS = 25_000

export function getMedusaRequestTimeoutMs(): number {
  const raw =
    process.env["MEDUSA_FETCH_TIMEOUT_MS"] ??
    process.env["NEXT_PUBLIC_MEDUSA_FETCH_TIMEOUT_MS"]
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MS
}

/**
 * Rejects with `Error` if `promise` does not settle within `ms`.
 */
export async function withRequestTimeout<T>(
  promise: Promise<T>,
  ms: number = getMedusaRequestTimeoutMs(),
  timeoutMessage = "คำขอหมดเวลา กรุณาลองอีกครั้ง"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(timeoutMessage))
        }, ms)
      }),
    ])
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}
