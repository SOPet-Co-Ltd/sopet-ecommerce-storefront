import {
  cleanCardNumber,
  getCardNumberLength,
  getCvvLength,
} from "./PaymentFormat"

export function getCardNumberError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "กรุณากรอกหมายเลขบัตร"

  const cleaned = cleanCardNumber(trimmed)
  if (
    !/^\d+$/.test(cleaned) ||
    cleaned.length !== getCardNumberLength(cleaned)
  ) {
    return "หมายเลขบัตรไม่ถูกต้อง"
  }

  return undefined
}

export function getExpiryError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "กรุณากรอกวันหมดอายุ"

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(trimmed)) {
    return "รูปแบบต้องเป็น MM/YY"
  }

  const [monthPart, yearPart] = trimmed.split("/")
  const month = parseInt(monthPart, 10)
  const year = 2000 + parseInt(yearPart, 10)
  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999)

  if (expiryEnd < new Date()) {
    return "บัตรหมดอายุแล้ว"
  }

  return undefined
}

export function getCvvError(
  value: string,
  cardNumber: string
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "กรุณากรอกรหัส CVV"

  if (!/^\d+$/.test(trimmed)) {
    return "CVV ไม่ถูกต้อง"
  }

  if (trimmed.length !== getCvvLength(cardNumber)) {
    return "CVV ไม่ถูกต้อง"
  }

  return undefined
}

export function getCardNameError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "กรุณากรอกชื่อบนบัตร"

  if (!/^[a-zA-Z\u0E00-\u0E7F\s]+$/.test(trimmed)) {
    return "ชื่อบนบัตรต้องเป็นตัวอักษรเท่านั้น"
  }

  return undefined
}

export const validateCardNumber = (value: string) =>
  getCardNumberError(value) ?? true

export const validateExpiry = (value: string) => getExpiryError(value) ?? true

export const validateCardName = (value: string) =>
  getCardNameError(value) ?? true

export const validateCvv = (cardNumber: string) => (value: string) =>
  getCvvError(value, cardNumber) ?? true
