export function buildThankYouPath(locale: string, orderId: string) {
  return `/${locale}/thank-you/${encodeURIComponent(orderId)}`
}
