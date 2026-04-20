'use client';
import { useEffect } from 'react';

const DEMO_TOKEN_KEY = 'token';
const DEMO_USER_KEY = 'user';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-inject demo credentials so API calls carry a valid Bearer token
    if (!localStorage.getItem(DEMO_TOKEN_KEY)) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@aegis.com', password: 'AdminPassword123!' }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.access_token) {
            localStorage.setItem(DEMO_TOKEN_KEY, data.access_token);
            localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ email: 'admin@aegis.com', role: 'admin' }));
          }
        })
        .catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
