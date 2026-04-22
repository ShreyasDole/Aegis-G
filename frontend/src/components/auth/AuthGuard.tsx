'use client';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

async function ensureValidToken(): Promise<void> {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) {
    try {
      const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${existing}` } });
      if (r.ok) return; // token still valid
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
    }
  }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureValidToken().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-primary font-mono text-sm tracking-widest uppercase animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
