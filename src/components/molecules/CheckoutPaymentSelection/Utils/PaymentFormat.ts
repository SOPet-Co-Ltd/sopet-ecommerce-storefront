export const formatCardNumber = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1-")
    .replace(/-$/, "")
    .slice(0, 19)
}

export const formatExpiry = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/(\d{2})(\d{0,2})/, (_, m, y) => (y ? `${m}/${y}` : m))
}

export const formatCVV = (value: string) => {
  return value.replace(/\D/g, "").slice(0, 4)
}

export const formatCardName = (value: string) => {
  return value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, "").replace(/\s{2,}/g, " ")
}
