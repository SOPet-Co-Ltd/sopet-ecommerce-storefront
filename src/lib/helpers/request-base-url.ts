/**
 * Resolves the public site origin for the current request (metadata, JSON-LD, canonical URLs).
 * Prefer `NEXT_PUBLIC_BASE_URL` when set so SSR matches configured production URL.
 */
export function getRequestBaseUrl(
  headersList: Headers,
  envBaseUrl?: string | null
): string {
  const fromEnv = envBaseUrl?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }

  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  return `${protocol}://${host}`
}
