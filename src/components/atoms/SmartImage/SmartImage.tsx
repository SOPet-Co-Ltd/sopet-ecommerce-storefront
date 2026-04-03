"use client"

/* eslint-disable jsx-a11y/alt-text */
import Image from "next/image"
import type { ImageProps } from "next/image"

import { cloudflareImageLoader, isR2Host } from "@/lib/images/cloudflare-loader"

/**
 * Wrapper around `next/image` that applies Cloudflare Image Transformations
 * only for images hosted on R2 (prod `r2.sopet.org` and dev `*.r2.dev`).
 *
 * All other images keep Next.js' default behavior.
 */
export function SmartImage(props: ImageProps) {
  // If a caller explicitly provides a loader, respect it.
  if (props.loader) {
    return <Image {...props} />
  }

  // Static imports / local assets should keep default behavior.
  if (typeof props.src !== "string") {
    return <Image {...props} />
  }

  let url: URL
  try {
    url = new URL(props.src)
  } catch {
    // Relative URLs (e.g. local assets) should keep default behavior.
    return <Image {...props} />
  }

  if (process.env.NODE_ENV === "development") {
    return <Image {...props} />
  }

  return <Image {...props} loader={cloudflareImageLoader} />
}

export default SmartImage
