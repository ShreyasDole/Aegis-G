/**
 * Centralized API client.
 * HTTP calls use relative /api/* paths → Next.js proxy → no CORS.
 * WebSocket connects directly to the backend host.
 */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET /api/... */
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

/** POST /api/... with JSON body */
export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

/** PUT /api/... with JSON body */
export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json();
}

/** DELETE /api/... */
export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

/**
 * WebSocket helper — connects directly to backend.
 * Uses window.location.hostname so it works in Docker + local dev.
 */
export function createWebSocket(wsPath: string): WebSocket {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const backendPort = process.env.NEXT_PUBLIC_WS_PORT || '8000';
  return new WebSocket(`ws://${host}:${backendPort}${wsPath}`);
}
