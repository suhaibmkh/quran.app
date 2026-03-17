import { NextRequest } from 'next/server';

const UPSTREAM_BASE = 'https://api.alquran.cloud/v1';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = Array.isArray(params.path) ? params.path.join('/') : '';
  const search = request.nextUrl.search || '';
  const targetUrl = `${UPSTREAM_BASE}/${path}${search}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const body = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') ?? 'application/json; charset=utf-8';

    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch {
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
