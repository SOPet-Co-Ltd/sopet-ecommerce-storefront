/**
 * Medusa fetch timeout (ms). **0 = disabled** (default) so slow UAT/backends are not aborted.
 * Set `MEDUSA_FETCH_TIMEOUT_MS` only if you explicitly want hard caps.
 */
export function getMedusaRequestTimeoutMs(): number {
  const raw =
    process.env["MEDUSA_FETCH_TIMEOUT_MS"] ??
    process.env["NEXT_PUBLIC_MEDUSA_FETCH_TIMEOUT_MS"]
  if (raw === undefined || String(raw).trim() === "") {
    return 0
  }
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Timeout for the heavy checkout cart GET. If unset, follows global (usually off).
 * Set `CHECKOUT_CART_FETCH_TIMEOUT_MS` to cap only this request.
 */
export function getCheckoutCartFetchTimeoutMs(): number {
  const raw = process.env["CHECKOUT_CART_FETCH_TIMEOUT_MS"]
  if (raw !== undefined && String(raw).trim() !== "") {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) {
      return n
    }
  }
  const base = getMedusaRequestTimeoutMs()
  if (base <= 0) {
    return 0
  }
  return Math.max(base, 45_000)
}

/**
 * Rejects with `Error` if `promise` does not settle within `ms`.
 */
export async function withRequestTimeout<T>(
  promise: Promise<T>,
  ms: number = getMedusaRequestTimeoutMs(),
  timeoutMessage = "คำขอหมดเวลา กรุณาลองอีกครั้ง"
): Promise<T> {
  if (ms <= 0) {
    return promise
  }
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
