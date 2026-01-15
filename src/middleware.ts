import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_ROUTES } from './lib/constants';
import { isTokenExpired } from './lib/helpers/token';

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'us';

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url);

  redirectUrl.searchParams.set(reason, 'true');

  const response = NextResponse.redirect(redirectUrl);

  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

export async function middleware(request: NextRequest) {
  // Handle OPTIONS requests (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-publishable-api-key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Short-circuit static assets
  if (request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const urlSegment = pathname.split('/')[1];
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || '');

  const pathnameWithoutLocale = looksLikeLocale ? pathname.replace(/^\/[^/]+/, '') : pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  // Handle protected routes - check token without backend calls
  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt');
    const token = jwtCookie?.value;

    // Use locale from URL or fallback to DEFAULT_REGION
    const locale = looksLikeLocale ? urlSegment : DEFAULT_REGION;

    // Not logged in before
    if (!jwtCookie) {
      return makeAuthRedirect(request, locale, 'sessionRequired');
    }

    // Token exists but expired (client-side check, no backend)
    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired');
    }
  }

  // Fast path: URL already has a locale segment, continue without redirect
  if (looksLikeLocale) {
    return NextResponse.next();
  }

  // No locale in URL - redirect to DEFAULT_REGION
  const redirectPath = pathname === '/' ? '' : pathname;
  const queryString = request.nextUrl.search ? request.nextUrl.search : '';
  const redirectUrl = `${request.nextUrl.origin}/${DEFAULT_REGION}${redirectPath}${queryString}`;
  return NextResponse.redirect(redirectUrl, 307);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};