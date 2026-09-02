import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';
  const search = req.nextUrl.search;
  
  // Clean base URL without trailing slash
  const cleanBackendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const targetUrl = `${cleanBackendUrl}/${path}${search}`;

  try {
    const headers = new Headers();
    const incomingContentType = req.headers.get('content-type');
    if (incomingContentType) {
      headers.set('content-type', incomingContentType);
    }

    let body: any = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body || undefined,
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`API Proxy error connecting to ${targetUrl}:`, error);
    return NextResponse.json(
      { detail: `Proxy failed to connect to FastAPI backend at ${targetUrl}: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}
