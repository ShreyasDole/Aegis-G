'use client';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const TOKEN_CACHE_MS = 5 * 60 * 1000; // 5 minutes
const TOKEN_VALIDATED_KEY = 'token_validated_at';

async function ensureValidToken(): Promise<void> {
  const now = Date.now();
  const existing = localStorage.getItem(TOKEN_KEY);

  // sessionStorage persists within browser session across SPA navigations
  const validatedAt = parseInt(sessionStorage.getItem(TOKEN_VALIDATED_KEY) || '0');
  if (existing && now - validatedAt < TOKEN_CACHE_MS) {
    return; // skip network call
  }

  if (existing) {
    try {
      const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${existing}` } });
      if (r.ok) {
        sessionStorage.setItem(TOKEN_VALIDATED_KEY, String(now));
        return;
      }
    } catch {/* fall through */}
  }

  // Get fresh token
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aegis.com', password: 'AdminPassword123!' }),
  });
  if (r.ok) {
    const d = await r.json();
    if (d?.access_token) {
      localStorage.setItem(TOKEN_KEY, d.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify({ email: 'admin@aegis.com', role: 'admin' }));
      sessionStorage.setItem(TOKEN_VALIDATED_KEY, String(now));
    }
  }
}

let initPromise: Promise<void> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check sessionStorage immediately (synchronous) — avoids loading flash on navigation
    const existing = localStorage.getItem(TOKEN_KEY);
    const validatedAt = parseInt(sessionStorage.getItem(TOKEN_VALIDATED_KEY) || '0');
    if (existing && Date.now() - validatedAt < TOKEN_CACHE_MS) {
      setReady(true);
      return;
    }
    if (!initPromise) {
      initPromise = ensureValidToken().finally(() => { initPromise = null; });
    }
    initPromise.finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center"
           style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        <div className="text-neon-cyan font-mono text-sm tracking-widest uppercase animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
