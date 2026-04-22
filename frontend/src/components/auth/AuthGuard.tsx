'use client';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Module-level cache — persists across page navigations (SPA)
let tokenValidatedAt = 0;
const TOKEN_CACHE_MS = 5 * 60 * 1000; // 5 minutes

async function ensureValidToken(): Promise<void> {
  const now = Date.now();
  const existing = localStorage.getItem(TOKEN_KEY);

  // Skip network check if token was validated recently
  if (existing && now - tokenValidatedAt < TOKEN_CACHE_MS) {
    return;
  }

  if (existing) {
    try {
      const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${existing}` } });
      if (r.ok) {
        tokenValidatedAt = now;
        return;
      }
    } catch {/* fall through */}
  }

  // Fetch fresh token
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
      tokenValidatedAt = now;
    }
  }
}

// Singleton promise — prevents duplicate calls on React Strict Mode double-invoke
let initPromise: Promise<void> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Always start false — same on server and client (prevents hydration mismatch)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If token recently validated, skip network call and show immediately
    if (tokenValidatedAt > 0 && Date.now() - tokenValidatedAt < TOKEN_CACHE_MS) {
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
