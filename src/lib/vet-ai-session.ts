const STORAGE_KEY = "vetai_conversation_v1"
const ONE_HOUR_MS = 60 * 60 * 1000

export type VetAiStoredMessage = {
  message: string
  isUser: boolean
}

export type VetAiSession = {
  conversationId: string
  lastActivityAt: number
  messages: VetAiStoredMessage[]
}

function isBrowser() {
  return typeof window !== "undefined"
}

export function getVetAiSession(): VetAiSession | null {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as VetAiSession

    if (
      !parsed ||
      !parsed.conversationId ||
      !Array.isArray(parsed.messages) ||
      typeof parsed.lastActivityAt !== "number"
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    const isExpired = Date.now() - parsed.lastActivityAt > ONE_HOUR_MS
    if (isExpired) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveVetAiSession(
  conversationId: string,
  messages: VetAiStoredMessage[]
) {
  if (!isBrowser()) {
    return
  }

  if (!conversationId) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  const session: VetAiSession = {
    conversationId,
    lastActivityAt: Date.now(),
    messages,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors (quota, etc.)
  }
}

export function clearVetAiSession() {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
