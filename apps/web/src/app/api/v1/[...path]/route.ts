import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function getInternalApiBaseUrl(): string {
  const configured = process.env.API_INTERNAL_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return process.env.NODE_ENV === 'production'
    ? 'http://nestjsnextjs-backend-1ybpq9:3101'
    : 'http://127.0.0.1:3101';
}

async function proxyToBackend(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const cleanSegments = path.map((segment) => encodeURIComponent(segment)).join('/');
  const targetUrl = `${getInternalApiBaseUrl()}/api/v1/${cleanSegments}${request.nextUrl.search}`;

  const upstreamHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      upstreamHeaders.set(key, value);
    }
  });

  if (!upstreamHeaders.has('x-forwarded-proto')) {
    upstreamHeaders.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', '') || 'https');
  }
  if (!upstreamHeaders.has('x-forwarded-host') && request.headers.get('host')) {
    upstreamHeaders.set('x-forwarded-host', request.headers.get('host') as string);
  }

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower) && lower !== 'set-cookie') {
        responseHeaders.set(key, value);
      }
    });

    const setCookies = upstreamResponse.headers.getSetCookie?.() ?? [];
    for (const cookieHeader of setCookies) {
      responseHeaders.append('set-cookie', cookieHeader);
    }

    if (cleanSegments.startsWith('auth/')) {
      responseHeaders.set('cache-control', 'no-store, private');
    }

    const payload = await upstreamResponse.arrayBuffer();
    return new NextResponse(payload, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        statusCode: 502,
        message: 'Service API G4D temporairement indisponible.',
      },
      { status: 502 },
    );
  }
}

export const dynamic = 'force-dynamic';

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;

