export const cleanCardNumber = (value: string) => value.replace(/\D/g, "")

export const getCardBrand = (value: string) => {
  const digits = cleanCardNumber(value)

  if (/^3[47]/.test(digits)) return "amex"

  return "unknown"
}

export const getCardNumberLength = (value: string) =>
  getCardBrand(value) === "amex" ? 15 : 16

export const getCvvLength = (cardNumber: string) =>
  getCardBrand(cardNumber) === "amex" ? 4 : 3

export const formatCardNumber = (value: string) => {
  const digits = cleanCardNumber(value).slice(0, getCardNumberLength(value))

  if (getCardBrand(digits) === "amex") {
    return digits
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, first, second, third) =>
        [first, second, third].filter(Boolean).join("-")
      )
      .replace(/-$/, "")
  }

  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "")
}

export const formatExpiry = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/(\d{2})(\d{0,2})/, (_, m, y) => (y ? `${m}/${y}` : m))
}

export const formatCVV = (value: string, cardNumber = "") => {
  return value.replace(/\D/g, "").slice(0, getCvvLength(cardNumber))
}

export const formatCardName = (value: string) => {
  return value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, "").replace(/\s{2,}/g, " ")
}
