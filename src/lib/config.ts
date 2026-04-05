import Medusa from "@medusajs/js-sdk"
import { getMedusaRequestTimeoutMs } from "@/lib/helpers/request-timeout"

// Defaults to standard port for Medusa server
export const MEDUSA_BACKEND_URL =
  process.env["NEXT_PUBLIC_MEDUSA_BACKEND_URL"] ||
  process.env["MEDUSA_BACKEND_URL"] ||
  "http://localhost:9000"

// Get publishable key - ensure it's a string and never undefined
// This is critical as the Medusa SDK requires a valid publishable key
const PUBLISHABLE_KEY = (
  process.env["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"] || ""
).trim()

// Log warning if key appears to be missing (but don't throw to allow app to start)
if (!PUBLISHABLE_KEY && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Medusa SDK] WARNING: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set or is empty."
  )
  console.warn(
    "[Medusa SDK] This will cause API calls to fail. Please ensure the environment variable is set."
  )
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  // Always provide publishableKey (even if empty) to prevent SDK initialization errors
  // The SDK will validate it when making requests and provide better error messages
  publishableKey: PUBLISHABLE_KEY,
})

type FetchQueryOptions = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, string | null | { tags: string[] }>
  query?: Record<string, string | number>
  body?: Record<string, unknown>
  /** Override default Medusa fetch timeout for this request (ms). */
  medusaTimeoutMs?: number
}

function mergeFetchSignal(
  userSignal: AbortSignal | null | undefined,
  timeoutMs: number = getMedusaRequestTimeoutMs()
): AbortSignal | undefined {
  const sig = userSignal ?? undefined
  if (
    typeof AbortSignal === "undefined" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    return sig
  }
  const timeoutSig = AbortSignal.timeout(timeoutMs)
  if (!sig) {
    return timeoutSig
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([sig, timeoutSig])
  }
  return sig
}

export async function fetchQuery(
  url: string,
  {
    method,
    query,
    headers,
    body,
    signal: userSignal,
    medusaTimeoutMs,
    ...rest
  }: FetchQueryOptions
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value))
    }
  }

  const publishableKey = process.env["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"] || ""

  const mergedSignal = mergeFetchSignal(
    userSignal,
    medusaTimeoutMs ?? getMedusaRequestTimeoutMs()
  )

  const init: RequestInit = {
    ...rest,
    ...(method ? { method } : {}),
    ...(mergedSignal ? { signal: mergedSignal } : {}),
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  let res: Response
  try {
    res = await fetch(
      `${MEDUSA_BACKEND_URL}${url}${params.toString() ? `?${params.toString()}` : ""}`,
      init
    )
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Network error or request aborted"
    return {
      ok: false,
      status: 0,
      error: { message },
      data: null,
    }
  }

  let data
  try {
    data = await res.json()
  } catch {
    data = { message: res.statusText || "Unknown error" }
  }

  return {
    ok: res.ok,
    status: res.status,
    error: res.ok ? null : { message: data?.message },
    data: res.ok ? data : null,
  }
}
