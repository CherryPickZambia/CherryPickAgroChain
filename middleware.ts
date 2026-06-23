import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getCanonicalHost,
  LEGACY_REDIRECT_HOSTS,
  PUBLIC_SITE_URL,
  resolveLegacyPublicPath,
} from '@/lib/site';

// The routes that need to be protected
const protectedRoutes = ['/dashboard', '/marketplace', '/api/admin', '/api/payments', '/api/lenco'];

function redirectLegacyHost(request: NextRequest): NextResponse | null {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const canonicalHost = getCanonicalHost();

  if (!host || host === 'localhost' || host === canonicalHost) {
    return null;
  }

  const path = resolveLegacyPublicPath(
    request.nextUrl.pathname,
    request.nextUrl.searchParams,
  );

  // Old printed QR / bookmarked links on legacy domains → canonical site
  if (LEGACY_REDIRECT_HOSTS.includes(host)) {
    const destination = new URL(path, PUBLIC_SITE_URL);
    const batchHandled = path.startsWith('/trace/');
    if (!batchHandled) {
      request.nextUrl.searchParams.forEach((value, key) => {
        destination.searchParams.set(key, value);
      });
    }
    return NextResponse.redirect(destination, 308);
  }

  return null;
}

function redirectLegacyPath(request: NextRequest): NextResponse | null {
  const path = resolveLegacyPublicPath(
    request.nextUrl.pathname,
    request.nextUrl.searchParams,
  );

  // Same domain: /lookup?batch=CODE → /trace/CODE (old NFT metadata links)
  if (path !== request.nextUrl.pathname) {
    const destination = request.nextUrl.clone();
    destination.pathname = path;
    destination.search = '';
    return NextResponse.redirect(destination, 308);
  }

  return null;
}

export function middleware(request: NextRequest) {
    const legacyHostRedirect = redirectLegacyHost(request);
    if (legacyHostRedirect) return legacyHostRedirect;

    const legacyPathRedirect = redirectLegacyPath(request);
    if (legacyPathRedirect) return legacyPathRedirect;

    const { pathname } = request.nextUrl;

    // Check if it's a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        // Check for CDP authentication cookie or local storage equivalent 
        // In CDP SDK, address is stored client-side. We use a custom cookie 'cp_wallet_session' here
        const addressCookie = request.cookies.get('cp_wallet_session');

        // Make an exception for Webhook routes which are hit directly by Base Network servers
        if (pathname.includes('/api/payments/base-pay-webhook')) {
            return NextResponse.next();
        }

        if (!addressCookie) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            } else {
                const url = request.nextUrl.clone();
                url.pathname = '/signin';
                // Add current path as redirect query param
                url.searchParams.set('redirect', pathname);
                return NextResponse.redirect(url);
            }
        }
    }

    // Add Security Headers
    const response = NextResponse.next();
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self), payment=(self)');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
