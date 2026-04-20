'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing token');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }
    const API_URL = '';
    localStorage.setItem('token', token);
    fetch(`/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((userData) => {
        if (userData) {
          localStorage.setItem(
            'user',
            JSON.stringify({
              email: userData.email,
              name: userData.full_name || 'Agent',
              role: userData.role,
            })
          );
        }
        window.location.href = '/dashboard';
      })
      .catch(() => {
        setError('Failed to load profile');
        setTimeout(() => router.replace('/login'), 2000);
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="text-text-secondary">{error}. Redirecting to login...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <p className="text-text-secondary">Signing you in...</p>
    </div>
  );
}
