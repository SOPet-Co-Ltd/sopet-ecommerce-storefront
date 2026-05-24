import { MEDUSA_BACKEND_URL } from "@/lib/config"

type CreateContactInformationInput = {
  customer_phone: string
  email?: string | null
}

type CreateContactInformationResponse = {
  id: string
}

export async function createContactInformation(
  input: CreateContactInformationInput
): Promise<CreateContactInformationResponse> {
  const publishableKey =
    process.env["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"]?.trim() ?? ""

  const response = await fetch(
    `${MEDUSA_BACKEND_URL}/store/contact-information`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({
        customer_phone: input.customer_phone.replace(/\D/g, ""),
        ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      }),
    }
  )

  const payload = (await response.json().catch(() => null)) as
    | CreateContactInformationResponse
    | { error?: string }
    | null
  console.log("payload:", payload)

  if (!response.ok) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "ไม่สามารถบันทึกข้อมูลการติดต่อได้"
    )
  }

  if (!payload || !("id" in payload) || !payload.id) {
    throw new Error("ไม่สามารถบันทึกข้อมูลการติดต่อได้")
  }

  return payload
}
