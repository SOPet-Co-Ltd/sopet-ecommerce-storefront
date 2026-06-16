import { NextRequest, NextResponse } from "next/server"

// Allowlist of permitted payment provider domains
const ALLOWED_HOSTS = [
  "",
  "api.omise.co",
  "cdn.omise.co",
  "omise.co",
  "omise-gateway-production.s3.ap-southeast-1.amazonaws.com",
]

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 (loopback)
  /^10\./, // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12 (private)
  /^192\.168\./, // 192.168.0.0/16 (private)
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^::1$/, // ::1 (IPv6 loopback)
  /^fe80:/, // fe80::/10 (IPv6 link-local)
  /^fc00:/, // fc00::/7 (IPv6 unique local)
]

function isPrivateIP(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname))
}

function isAllowedHost(hostname: string): boolean {
  // Block raw IP addresses
  if (/^[\d.:]+$/.test(hostname)) {
    return false
  }

  // Check if hostname matches allowlist (exact match or subdomain)
  return ALLOWED_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  )
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url")

  if (!imageUrl) {
    return NextResponse.json({ message: "url is required" }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return NextResponse.json({ message: "invalid url" }, { status: 400 })
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ message: "invalid protocol" }, { status: 400 })
  }

  // Validate hostname against allowlist
  const hostname = parsedUrl.hostname.toLowerCase()

  if (!isAllowedHost(hostname)) {
    return NextResponse.json({ message: "host not permitted" }, { status: 403 })
  }

  // Defense-in-depth: block private IPs even if they somehow pass allowlist
  if (isPrivateIP(hostname)) {
    return NextResponse.json(
      { message: "private IP addresses not permitted" },
      { status: 403 }
    )
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      method: "GET",
      cache: "no-store",
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { message: `failed to fetch image (${upstream.status})` },
        { status: 502 }
      )
    }

    const arrayBuffer = await upstream.arrayBuffer()
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream"

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { message: "failed to fetch upstream image" },
      { status: 502 }
    )
  }
}
