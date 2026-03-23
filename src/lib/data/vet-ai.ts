import { fetchQuery } from "@/lib/config"

type SendVetAiMessageSuccess = {
  ok: true
  reply: string
  conversationId: string
}

type SendVetAiMessageFailure = {
  ok: false
  error: string
}

export type SendVetAiMessageResult =
  | SendVetAiMessageSuccess
  | SendVetAiMessageFailure

type VetAiApiResponse = {
  reply?: string
  conversationId?: string
}

export async function sendVetAiMessage(
  message: string,
  options?: {
    conversationId?: string
    customerId?: string
    metadata?: {
      name?: string
      email?: string
    }
  }
): Promise<SendVetAiMessageResult> {
  const trimmed = message.trim()

  if (!trimmed) {
    return { ok: false, error: "Message is required" }
  }

  const response = await fetchQuery("/store/konkui-chat", {
    method: "POST",
    body: {
      message: trimmed,
      conversationId: options?.conversationId,
      customerId: options?.customerId,
      metadata: options?.metadata,
    },
  })

  if (!response.ok) {
    return {
      ok: false,
      error: response.error?.message || "Failed to send message",
    }
  }

  const data = (response.data ?? {}) as VetAiApiResponse

  if (!data.reply?.trim()) {
    return { ok: false, error: "AI response is empty" }
  }

  if (!data.conversationId?.trim()) {
    return { ok: false, error: "Missing conversationId from AI service" }
  }

  return {
    ok: true,
    reply: data.reply.trim(),
    conversationId: data.conversationId.trim(),
  }
}
