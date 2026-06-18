import type { MetadataRoute } from "next"
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_REGION,
} from "@/lib/site-defaults"

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || DEFAULT_SITE_NAME
  const description =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() || DEFAULT_SITE_DESCRIPTION
  const defaultLocale = DEFAULT_REGION.toLowerCase()
  const start = `/${defaultLocale}/`

  return {
    name,
    short_name: name,
    description,
    start_url: start,
    scope: "/",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#9c6ade",
    lang: "th",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  }
}
