import Medusa from "@medusajs/js-sdk"

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
}

export async function fetchQuery(
  url: string,
  { method, query, headers, body, ...rest }: FetchQueryOptions
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value))
    }
  }

  const publishableKey = process.env["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"] || ""

  const init: RequestInit = {
    ...rest,
    ...(method ? { method } : {}),
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  const res = await fetch(
    `${MEDUSA_BACKEND_URL}${url}${params.toString() ? `?${params.toString()}` : ""}`,
    init
  )

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
