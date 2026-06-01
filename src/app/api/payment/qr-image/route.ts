import { NextRequest, NextResponse } from "next/server"

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
