import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The routes that need to be protected
const protectedRoutes = ['/dashboard', '/marketplace', '/api/admin', '/api/payments'];

export function middleware(request: NextRequest) {
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
