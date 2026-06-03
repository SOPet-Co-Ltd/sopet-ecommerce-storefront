export function buildThankYouPath(locale: string, orderId: string) {
  return `/${locale}/thank-you/${encodeURIComponent(orderId)}`
}

export function buildThankYouPathFromDisplayId(
  locale: string,
  displayId: number
) {
  return `/${locale}/thank-you/${encodeURIComponent(`SOP-${displayId}`)}`
}
