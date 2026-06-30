import { NextRequest, NextResponse } from "next/server"

import { GUEST_ONLY_ROUTES, PROTECTED_ROUTES } from "./lib/constants"
import { isTokenExpired } from "./lib/helpers/token"
import { DEFAULT_REGION } from "./lib/site-defaults"

function getPathContext(pathname: string) {
  const segment = pathname.split("/")[1]
  const looksLikeLocale = /^[a-z]{2}$/i.test(segment || "")
  const pathWithoutLocale = looksLikeLocale
    ? pathname.replace(/^\/[^/]+/, "") || "/"
    : pathname
  const locale = looksLikeLocale ? segment! : DEFAULT_REGION
  return { pathWithoutLocale, looksLikeLocale, locale }
}

function hasValidSession(request: NextRequest): boolean {
  const jwtCookie = request.cookies.get("_medusa_jwt")
  const token = jwtCookie?.value
  if (!token) return false
  return !isTokenExpired(token)
}

function isProtectedPath(pathWithoutLocale: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathWithoutLocale.startsWith(route))
}

function isGuestOnlyPath(pathWithoutLocale: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => pathWithoutLocale.startsWith(route))
}

function redirectToLogin(
  req: NextRequest,
  locale: string,
  reason: "sessionRequired" | "sessionExpired"
) {
  const url = new URL(`/${locale}/login`, req.url)
  url.searchParams.set(reason, "true")
  const res = NextResponse.redirect(url)
  if (reason === "sessionExpired") {
    res.cookies.delete("_medusa_jwt")
  }
  return res
}

function redirectToUserArea(req: NextRequest, locale: string) {
  return NextResponse.redirect(new URL(`/${locale}/user`, req.url), 307)
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-publishable-api-key",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const { pathWithoutLocale, looksLikeLocale, locale } =
    getPathContext(pathname)
  const jwtCookie = request.cookies.get("_medusa_jwt")
  const authenticated = hasValidSession(request)

  if (
    isGuestOnlyPath(pathWithoutLocale) &&
    request.nextUrl.searchParams.get("sessionExpired") === "true" &&
    jwtCookie?.value
  ) {
    const res = NextResponse.next()
    res.cookies.delete("_medusa_jwt")
    return res
  }

  // Authenticated customer must not access login/register → redirect to account
  if (authenticated && isGuestOnlyPath(pathWithoutLocale)) {
    return redirectToUserArea(request, locale)
  }

  // Anything under [locale]/user requires auth
  if (isProtectedPath(pathWithoutLocale) && !authenticated) {
    const reason =
      jwtCookie?.value && isTokenExpired(jwtCookie.value)
        ? "sessionExpired"
        : "sessionRequired"
    return redirectToLogin(request, locale, reason)
  }

  if (looksLikeLocale) {
    return NextResponse.next()
  }

  const redirectPath = pathname === "/" ? "" : pathname
  const query = request.nextUrl.search ? request.nextUrl.search : ""
  const redirectUrl = `${request.nextUrl.origin}/${DEFAULT_REGION}${redirectPath}${query}`
  return NextResponse.redirect(redirectUrl, 307)
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
