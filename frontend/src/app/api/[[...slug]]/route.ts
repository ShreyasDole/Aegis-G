import { NextRequest, NextResponse } from 'next/server';

function backendBase(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000';
  return raw.replace(/\/$/, '');
}

function apiPath(slug: string[] | undefined): string {
  const parts = (slug || []).filter(Boolean);
  if (!parts.length) return '/api';
  return `/api/${parts.join('/')}`;
}

async function proxy(req: NextRequest, ctx: { params: { slug?: string[] } }) {
  const path = apiPath(ctx.params.slug);
  const target = `${backendBase()}${path}${req.nextUrl.search}`;
  const headers = new Headers();
  for (const h of [
    'authorization',
    'content-type',
    'accept',
    'accept-language',
    'cookie',
    'x-inference-mode',
  ]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }

  let body: string | ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await req.arrayBuffer();
    if (body.byteLength === 0) body = undefined;
  }

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: body as BodyInit | undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    });
    const outHeaders = new Headers();
    res.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'transfer-encoding') return;
      outHeaders.set(k, v);
    });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { status: res.status, headers: outHeaders });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        detail: `API proxy: cannot reach backend at ${backendBase()} (${msg})`,
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
