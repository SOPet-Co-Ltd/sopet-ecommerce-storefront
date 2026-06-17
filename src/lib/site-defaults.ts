/** Fallbacks when `NEXT_PUBLIC_SITE_*` env vars are not set */
export const DEFAULT_SITE_NAME = "Sopet"

export const DEFAULT_SITE_DESCRIPTION =
  "Sopet คือแพลตฟอร์มค้นหายาและสินค้าสำหรับสัตว์เลี้ยงจากโรงพยาบาลและร้านขายยาทั่วไทย เปรียบเทียบราคา รับโค้ดส่วนลด และจัดส่งรวดเร็ว"

export const DEFAULT_REGION = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "th").toLowerCase()

/** Absolute origin for robots, sitemap, and manifest (matches root layout metadataBase fallback). */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, "")
  return "http://localhost:3000"
}

