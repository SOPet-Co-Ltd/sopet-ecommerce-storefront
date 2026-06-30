const PRODUCTION_SOFT_DELETE_RETENTION_HOURS = 15 * 24
const DEVELOPMENT_SOFT_DELETE_RETENTION_HOURS = 24

export function getSoftDeleteRetentionHours(): number {
  const fromEnv = process.env.NEXT_PUBLIC_CUSTOMER_SOFT_DELETE_RETENTION_HOURS
  if (fromEnv != null && fromEnv.trim() !== "") {
    const parsed = Number(fromEnv)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  if (process.env.NODE_ENV === "development") {
    return DEVELOPMENT_SOFT_DELETE_RETENTION_HOURS
  }

  return PRODUCTION_SOFT_DELETE_RETENTION_HOURS
}

export function formatSoftDeleteRetentionPeriodThai(
  hours: number = getSoftDeleteRetentionHours()
): string {
  if (hours < 24) {
    return `${hours} ชั่วโมง`
  }

  if (hours % 24 === 0) {
    return `${hours / 24} วัน`
  }

  return `${hours} ชั่วโมง`
}
