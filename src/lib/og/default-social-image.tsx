import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
} from "@/lib/site-defaults"

/** Google-hosted Noto Sans Thai (TTF) — supports site description in Thai */
const NOTO_SANS_THAI_TTF =
  "https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf"
const LOCAL_OG_FALLBACK_FONT_PATH = join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "compiled",
  "@vercel",
  "og",
  "noto-sans-v27-latin-regular.ttf"
)

function hostnameFooter(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname
  } catch {
    return ""
  }
}

export async function createDefaultSocialImageResponse(): Promise<ImageResponse> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME
  const description =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || DEFAULT_SITE_DESCRIPTION

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ).replace(/\/$/, "")

  const line =
    description.length > 140 ? `${description.slice(0, 137)}…` : description

  let logoDataUrl = ""
  try {
    const svg = await readFile(
      join(process.cwd(), "public", "Logo.svg"),
      "utf8"
    )
    logoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch {
    logoDataUrl = `${baseUrl}/Logo.svg`
  }

  let fontData: ArrayBuffer
  try {
    const res = await fetch(NOTO_SANS_THAI_TTF)
    if (res.ok) {
      fontData = await res.arrayBuffer()
    } else {
      const fallbackFontBuffer = await readFile(LOCAL_OG_FALLBACK_FONT_PATH)
      fontData = fallbackFontBuffer.buffer.slice(
        fallbackFontBuffer.byteOffset,
        fallbackFontBuffer.byteOffset + fallbackFontBuffer.byteLength
      )
    }
  } catch {
    const fallbackFontBuffer = await readFile(LOCAL_OG_FALLBACK_FONT_PATH)
    fontData = fallbackFontBuffer.buffer.slice(
      fallbackFontBuffer.byteOffset,
      fallbackFontBuffer.byteOffset + fallbackFontBuffer.byteLength
    )
  }

  const fontFamily = "Noto Sans Thai"
  const footer = hostnameFooter(baseUrl)

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "56px 64px",
        background:
          "linear-gradient(135deg, #0d3d30 0%, #1a6b52 42%, #2a9d7a 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUrl}
          alt=""
          height={52}
          style={{ height: 52, width: "auto", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          fontSize: 62,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.08,
          fontFamily,
          letterSpacing: "-0.03em",
        }}
      >
        {siteName}
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 26,
          fontWeight: 400,
          color: "rgba(255,255,255,0.92)",
          lineHeight: 1.45,
          maxWidth: 920,
          fontFamily,
        }}
      >
        {line}
      </div>
      {footer ? (
        <div
          style={{
            position: "absolute",
            bottom: 44,
            right: 64,
            fontSize: 18,
            color: "rgba(255,255,255,0.45)",
            fontFamily,
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans Thai",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  )
}
