import { NextRequest } from 'next/server';

const UPSTREAM_BASE = 'https://api.alquran.cloud/v1';

export const runtime = 'nodejs';

// Server-side in-memory cache – survives individual requests, cleared on server restart
const serverCache = new Map<string, { body: string; contentType: string; ts: number }>();
const SERVER_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = Array.isArray(params.path) ? params.path.join('/') : '';
  const search = request.nextUrl.search || '';
  const targetUrl = `${UPSTREAM_BASE}/${path}${search}`;

  // Serve from server cache if still fresh
  const hit = serverCache.get(targetUrl);
  if (hit && Date.now() - hit.ts < SERVER_CACHE_TTL) {
    return new Response(hit.body, {
      status: 200,
      headers: {
        'content-type': hit.contentType,
        // Cacheable by the browser / service worker
        'cache-control': 'public, max-age=604800',
      },
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Let Next.js revalidate once a week instead of fetching every request
      next: { revalidate: 604800 },
    });

    const body = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') ?? 'application/json; charset=utf-8';

    if (upstreamRes.ok) {
      serverCache.set(targetUrl, { body, contentType, ts: Date.now() });
    }

    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        'content-type': contentType,
        // Allow the browser and service worker to cache successful responses
        'cache-control': upstreamRes.ok ? 'public, max-age=604800' : 'no-store',
      },
    });
  } catch {
    // Upstream unreachable – fall back to a stale server-cache entry if one exists
    if (hit) {
      return new Response(hit.body, {
        status: 200,
        headers: {
          'content-type': hit.contentType,
          'cache-control': 'public, max-age=604800',
        },
      });
    }

    return Response.json(
      {
        code: 503,
        status: 'ERROR',
        data: null,
        message: 'تعذّر الاتصال بمصدر بيانات القرآن حالياً',
      },
      { status: 503 }
    );
  }
}
