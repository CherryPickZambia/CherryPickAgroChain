import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://46.202.194.248:3001';

async function proxyRequest(path: string, method: string, req: NextRequest) {
    try {
        const body = method === 'POST' ? await req.json() : null;

        console.log(`[Lenco Proxy] Forwarding ${method} to VPS: ${path}`);

        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${VPS_API_URL}${path}`, options);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Lenco Proxy] Error forwarding to VPS (${path}):`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to connect to Lenco VPS backend' },
            { status: 502 }
        );
    }
}

// Routes
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
