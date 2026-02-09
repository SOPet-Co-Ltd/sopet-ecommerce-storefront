import type { ImageLoader, ImageLoaderProps } from "next/image"

const R2_PROD_HOST = "r2.sopet.co"

function isR2DevHost(hostname: string) {
  return hostname.endsWith(".r2.dev")
}

export function isR2Host(hostname: string) {
  return hostname === R2_PROD_HOST || isR2DevHost(hostname)
}

/**
 * Build a Cloudflare Image Transformations URL.
 *
 * - For production R2 custom domain (`r2.sopet.co`), we keep the same origin and
 *   transform using the image path.
 * - For dev (`*.r2.dev`), we transform on a zone you control (default `sopet.co`)
 *   and use the full absolute source URL as the input.
 *
 * Ref: https://developers.cloudflare.com/images/transform-images/transform-via-url
 */
export const cloudflareImageLoader: ImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps) => {
  // Avoid double-transforming already-resized URLs.
  if (src.includes("/cdn-cgi/image/")) {
    return src
  }

  let url: URL
  try {
    url = new URL(src)
  } catch {
    // If this isn't an absolute URL (e.g. local/static), leave it alone.
    return src
  }

  // Cloudflare requires at least one option. Next always provides `width`.
  const q = quality ?? 85
  const options = `fit=scale-down,width=${width},quality=${q},format=auto`

  // Same-origin transform for production R2 custom domain.
  if (url.hostname === R2_PROD_HOST) {
    return `${url.origin}/cdn-cgi/image/${options}${url.pathname}${url.search}`
  }

  // Dev: Transform on a zone you control, using the absolute URL as the source.
  if (isR2DevHost(url.hostname)) {
    const zone =
      (process.env.NEXT_PUBLIC_CF_IMAGE_ZONE || "").trim() ||
      "https://sopet.org"
    const zoneOrigin = zone.startsWith("http") ? zone : `https://${zone}`
    return `${zoneOrigin}/cdn-cgi/image/${options}/${src}`
  }

  // Not an R2 image.
  return src
}
