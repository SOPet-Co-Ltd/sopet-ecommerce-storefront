"use client"

/**
 * Initiates OAuth flow by fetching the auth URL from backend, then redirecting to OAuth provider.
 * The OAuth provider will redirect to the backend callback, which then redirects to the frontend.
 */
export async function initiateOAuth(provider: "google" | "facebook" | "line") {
  if (typeof window === "undefined") {
    return
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    console.error("Publishable API key is not configured")
    return
  }

  // Redirect URI for authorize + token steps comes from backend env (getOAuthCallbackRedirectUri).
  const oauthUrl = `${backendUrl}/store/auth/oauth/${provider}`

  try {
    // Fetch the OAuth URL from backend with the required publishable API key header
    const response = await fetch(oauthUrl, {
      method: "GET",
      headers: {
        "x-publishable-api-key": publishableKey,
      },
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }))
      console.error("OAuth initiation failed:", errorData)
      return
    }

    // Backend returns JSON with auth URL
    const data = await response.json()
    if (data.success && data.authUrl) {
      window.location.href = data.authUrl
    } else {
      console.error("OAuth initiation failed: No auth URL received")
    }
  } catch (error) {
    console.error("Failed to initiate OAuth:", error)
  }
}
