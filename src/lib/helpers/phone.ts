export const THAI_PHONE_COUNTRY_CODE = "+66"
export const THAI_PHONE_SUBSCRIBER_LENGTH = 9

export function getThaiPhoneSubscriber(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "")

  if (digits.startsWith("660")) {
    return digits.slice(3, 3 + THAI_PHONE_SUBSCRIBER_LENGTH)
  }

  if (digits.startsWith("66")) {
    return digits.slice(2, 2 + THAI_PHONE_SUBSCRIBER_LENGTH)
  }

  if (digits.startsWith("0")) {
    return digits.slice(1, 1 + THAI_PHONE_SUBSCRIBER_LENGTH)
  }

  return digits.slice(0, THAI_PHONE_SUBSCRIBER_LENGTH)
}

export function formatThaiPhoneSubscriber(value: string | null | undefined) {
  const subscriber = getThaiPhoneSubscriber(value)

  if (subscriber.length <= 2) {
    return subscriber
  }

  if (subscriber.length <= 5) {
    return `${subscriber.slice(0, 2)}-${subscriber.slice(2)}`
  }

  return `${subscriber.slice(0, 2)}-${subscriber.slice(2, 5)}-${subscriber.slice(5)}`
}

export function normalizeThaiPhoneNumber(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim()

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("+") && !trimmed.startsWith(THAI_PHONE_COUNTRY_CODE)) {
    return trimmed
  }

  const subscriber = getThaiPhoneSubscriber(trimmed)

  if (subscriber.length === THAI_PHONE_SUBSCRIBER_LENGTH) {
    return `${THAI_PHONE_COUNTRY_CODE}${subscriber}`
  }

  return trimmed
}

export function isValidThaiPhoneNumber(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim()

  if (trimmed.startsWith("+") && !trimmed.startsWith(THAI_PHONE_COUNTRY_CODE)) {
    return false
  }

  return getThaiPhoneSubscriber(value).length === THAI_PHONE_SUBSCRIBER_LENGTH
}

export function formatThaiPhoneNumberForDisplay(
  value: string | null | undefined
) {
  const trimmed = String(value ?? "").trim()

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("+") && !trimmed.startsWith(THAI_PHONE_COUNTRY_CODE)) {
    return trimmed
  }

  const subscriber = getThaiPhoneSubscriber(trimmed)

  if (subscriber.length !== THAI_PHONE_SUBSCRIBER_LENGTH) {
    return trimmed
  }

  return `${THAI_PHONE_COUNTRY_CODE} ${formatThaiPhoneSubscriber(subscriber)}`
}
