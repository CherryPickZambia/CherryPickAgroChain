import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://46.202.194.248:3001';

// Allowlist of Lenco backend endpoints that may be reached through this proxy.
// This prevents arbitrary path forwarding (SSRF) to the internal VPS and limits
// the surface to known payment operations only.
const ALLOWED_ROUTES: { method: 'GET' | 'POST'; pattern: RegExp }[] = [
    { method: 'POST', pattern: /^\/api\/transfers\/mobile-money$/ },
    { method: 'POST', pattern: /^\/api\/transfers\/bank-account$/ },
    { method: 'POST', pattern: /^\/api\/transfers\/account$/ },
    { method: 'GET', pattern: /^\/api\/transfers\/status\/[A-Za-z0-9._-]+$/ },
    { method: 'POST', pattern: /^\/api\/collections\/mobile-money$/ },
    { method: 'GET', pattern: /^\/api\/banks$/ },
];

function isAllowed(method: 'GET' | 'POST', pathWithoutQuery: string) {
    return ALLOWED_ROUTES.some((r) => r.method === method && r.pattern.test(pathWithoutQuery));
}

async function proxyRequest(path: string, method: 'GET' | 'POST', req: NextRequest) {
    const pathWithoutQuery = path.split('?')[0];

    if (!isAllowed(method, pathWithoutQuery)) {
        console.warn(`[Lenco Proxy] Blocked disallowed ${method} ${pathWithoutQuery}`);
        return NextResponse.json(
            { success: false, error: 'Not found' },
            { status: 404 }
        );
    }

    try {
        const body = method === 'POST' ? await req.json() : null;

        console.log(`[Lenco Proxy] Forwarding ${method} to VPS: ${pathWithoutQuery}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${VPS_API_URL}${path}`, options);
        clearTimeout(timeout);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[Lenco Proxy] Error forwarding to VPS (${pathWithoutQuery}):`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to connect to Lenco VPS backend' },
            { status: 502 }
        );
    }
}

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/lenco/, '');
    return proxyRequest(path, 'POST', req);
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/lenco/, '') + url.search;
    return proxyRequest(path, 'GET', req);
}
